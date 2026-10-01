"""Groundwater - how deep the water table is, at a well or across a state.

USGS publishes every monitoring well's daily depth to water, keyless, and nobody asks it from an
editor. "how deep is the water table in Kansas?" gets the newest reading from each well reporting
in the last week, with the spread, because a water table is not one number.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from acp_kit import (STOP_END_TURN, STOP_REFUSAL, AcpAgent, GatewayClient,  # noqa: E402
                     GatewayError, SessionContext, empty_premium_answer, premium_call,
                     prompt_text)

from data import (DATASET, GroundwaterData, GroundwaterError,  # noqa: E402
                  GroundwaterNotFound, identifier_from_text, state_from_text)

HELP = (
    "I read USGS's water API (keyless) - every monitoring well's daily depth to water. Ask me:\n"
    "  - how deep is the water table in Kansas?\n"
    "  - water level at site 395847084085500\n"
    "  - well OH015-395847084085500 over the last 30 days\n"
    "  - is the water table dropping in Arizona?\n"
    "The figure is depth to water in feet *below land surface*, so a bigger number is a deeper\n"
    "water table. For a state I report the newest reading from each well that reported this week,\n"
    "with the median and the spread, because one number cannot describe a whole state.\n"
    "A whole-country figure is not offered: the API's daily data is not state-filterable, so a\n"
    "country would mean paging through every well, which I do not fake."
)

PERMISSION_KEY = "groundwater-read-usgs-water-api"

SKILLS = ("groundwater-well", "groundwater-state", "groundwater-trends", "help")

_WINDOW_RE = re.compile(r"\b(?:last|past|over the last|for)\s+(\d{1,3})\s+days?\b", re.IGNORECASE)
_WEEKS_RE = re.compile(r"\b(?:last|past|over the last)\s+(\d{1,2})\s+weeks?\b", re.IGNORECASE)
_LIMIT_RE = re.compile(r"\b(?:top|first|sample|show|list)\s+(\d{1,3})\b", re.IGNORECASE)
_GROUNDWATER_WORDS = re.compile(r"\b(water table|groundwater|ground water|water level|aquifer|"
                                r"well|wells|depth to water|drought|dropping|dropped|"
                                r"recharging|recharge)\b", re.IGNORECASE)
_WELL_WORDS = re.compile(r"\b(site|well|gauge|monitoring location|location)\b", re.IGNORECASE)
_OTHER_WORDS = re.compile(r"\b(weather|temperature|forecast|snow|surf|tide|river stage|"
                          r"flood|earthquake|air quality)\b", re.IGNORECASE)

#: A monitoring location id in the form OH015-395847084085500. Only this form
#: reaches the premium skill: the free well skill is the one that can turn a bare
#: site number into a location id, so that case stays with the free skill.
_LOCATION_ID_RE = re.compile(r"\b[A-Za-z]{2}\d{3}-\d{10,16}\b")

#: A question asking for a *rate* rather than a reading. The free well skill
#: prints the readings and a first-to-last difference, so a rate, a fit, a
#: projection or a long horizon is the premium question. Nothing else is: "is the
#: water table rising here" and "water level at site X" stay free.
_TREND_WORDS = re.compile(
    r"\b(trend|trends|trending|slope|rate of change|rate|how fast|per day|per week|per month|"
    r"per year|projecting|projection|projected|where will|long-term|long term|seasonal|"
    r"trend line)\b",
    re.IGNORECASE,
)


def route(text: str) -> tuple[str, dict]:
    """Deterministic intent routing: (skill, params). Pure function, easy to test."""
    stripped = str(text or "").strip()
    if not stripped or re.search(r"\b(help|what can you do|commands?)\b", stripped, re.IGNORECASE):
        return "help", {}
    identifier = identifier_from_text(stripped)
    state = state_from_text(stripped)
    # Checked before the free well route, and narrow on purpose: a rate question
    # with a location id in it. A state question, or a bare site number, falls
    # through to the free skills below.
    if state is None and _TREND_WORDS.search(stripped) and _LOCATION_ID_RE.search(stripped):
        params: dict = {"identifier": _LOCATION_ID_RE.search(stripped).group(0).upper()}
        days = _WINDOW_RE.search(stripped)
        if days:
            params["days"] = int(days.group(1))
        else:
            weeks = _WEEKS_RE.search(stripped)
            if weeks:
                params["days"] = int(weeks.group(1)) * 7
        return "groundwater-trends", params
    if identifier and (state is None or _WELL_WORDS.search(stripped)):
        params: dict = {"identifier": identifier}
        days = _WINDOW_RE.search(stripped)
        if days:
            params["days"] = int(days.group(1))
        else:
            weeks = _WEEKS_RE.search(stripped)
            if weeks:
                params["days"] = int(weeks.group(1)) * 7
        return "groundwater-well", params
    if state and not _OTHER_WORDS.search(stripped):
        params = {"state": state}
        days = _WINDOW_RE.search(stripped)
        weeks = _WEEKS_RE.search(stripped)
        if days:
            params["days"] = int(days.group(1))
        elif weeks:
            params["days"] = int(weeks.group(1)) * 7
        limit = _LIMIT_RE.search(stripped)
        if limit:
            params["limit"] = int(limit.group(1))
        return "groundwater-state", params
    if _GROUNDWATER_WORDS.search(stripped) and identifier:
        return "groundwater-well", {"identifier": identifier}
    return "help", {}


def render_well(well: dict) -> str:
    """One well: its record, then its depths."""
    lines = [f"{well['name']} ({well['number']})"]
    where = ", ".join(bit for bit in (well["county"], well["state"]) if bit)
    if where:
        lines.append(f"  location: {where}")
    if well["site_type"]:
        lines.append(f"  site type: {well['site_type']}")
    if well["well_depth"]:
        lines.append(f"  well depth: {well['well_depth']} ft")
    if well["aquifer"]:
        lines.append(f"  aquifer: {well['aquifer']}")
    if well["latitude"] is not None:
        lines.append(f"  coordinates: {float(well['latitude']):.5f}, "
                     f"{float(well['longitude']):.5f}")
    depth = well["latest"]["depth_ft"]
    lines.append(f"  depth to water: {depth:g} ft below land surface on {well['latest']['date']}"
                 + (f" ({well['latest']['status']})" if well["latest"].get("status") else ""))
    if well["days"] > 1:
        first = well["oldest"]["depth_ft"]
        change = depth - first
        word = ("dropping" if change > 0.05 else ("rising" if change < -0.05 else "steady"))
        lines.append(f"  {well['days']} reading(s) from {well['oldest']['date']} to "
                     f"{well['latest']['date']}: {change:+.2f} ft ({word})")
        for row in well["readings"][-8:]:
            lines.append(f"    {row['date']}: {row['depth_ft']:g} ft")
    lines.append(f"  {well['url']}")
    return "\n".join(lines)


def render_state(overview: dict) -> str:
    """A state's wells: how many, how deep, and how wide the spread."""
    lines = [f"{overview['state']} - depth to water in the last {overview['days']} day(s):"]
    lines.append(f"  {overview['wells']} well(s) reported"
                 + (f" (the newest {overview['asked_for']} returned by USGS, so there may be more)"
                    if overview["truncated"] else ""))
    lines.append(f"  median: {overview['median_ft']:g} ft below land surface")
    lines.append(f"  shallowest: {overview['shallowest']['depth_ft']:g} ft "
                 f"({overview['shallowest']['location_id']}, {overview['shallowest']['date']})")
    if overview["shallowest"]["depth_ft"] < 0:
        lines.append("  (a negative depth means the water stood above the land surface at that "
                     "well)")
    lines.append(f"  deepest: {overview['deepest']['depth_ft']:g} ft "
                 f"({overview['deepest']['location_id']}, {overview['deepest']['date']})")
    others = overview["rows"][1:-1]
    if others:
        lines.append("  other wells: "
                     + ", ".join(f"{row['depth_ft']:g} ft" for row in others[:10]))
    return "\n".join(lines)


def _num(value) -> str:
    """A number for a line of text, or the honest 'not reported'."""
    if value is None or value == "":
        return "not reported"
    try:
        return f"{float(value):g}"
    except (TypeError, ValueError):
        return str(value)


def render_trend(data: dict) -> str:
    """One well's fitted trend: the rate, the direction, and where it is heading."""
    window = data.get("window") or {}
    latest = data.get("latest") or {}
    oldest = data.get("oldest") or {}
    spread = data.get("depth_spread") or {}
    projected = data.get("projected_in_30_days") or {}
    lines = [f"{data.get('location_id', 'not reported')} - water table fitted over "
             f"{_num(window.get('span_days'))} day(s) of the {_num(window.get('days'))}-"
             f"day window asked for, from {data.get('readings_used', 0)} reading(s)"]
    lines.append(f"  readings: {oldest.get('date', 'not reported')} to "
                 f"{latest.get('date', 'not reported')}")
    lines.append(f"  direction: {data.get('trend', 'not reported')} at "
                 f"{_num(data.get('rate_per_year_ft'))} ft a year "
                 f"({_num(data.get('rate_per_day_ft'))} ft a day)")
    lines.append(f"  depth now: {_num(latest.get('depth_ft'))} ft below land surface")
    change = data.get("change_over_window_ft")
    lines.append(f"  change over the window: {_num(change)} ft"
                 + (f" ({'+' if change > 0 else ''}{_num(change)} deeper)"
                    if isinstance(change, (int, float)) else ""))
    lines.append(f"  depths in the window: shallowest {_num(spread.get('min_ft'))} ft, "
                 f"median {_num(spread.get('median_ft'))} ft, deepest {_num(spread.get('max_ft'))} ft")
    lines.append(f"  if the fitted line holds, {projected.get('date', 'not reported')} would be "
                 f"about {_num(projected.get('depth_ft'))} ft ({projected.get('note', 'not reported')})")
    lines.append(f"  unit {data.get('unit', 'not reported')}, "
                 f"{data.get('approval_status', 'not reported')} reading")
    lines.append(f"  source: {data.get('source', 'not reported')}")
    return "\n".join(lines)


class GroundwaterAgent(AcpAgent):
    name = "groundwater"
    title = "Groundwater - depth to the water table, at a well or across a state"
    version = "1.0.0"

    def __init__(self, connection=None, data: GroundwaterData | None = None,
                 gateway=None) -> None:
        super().__init__(connection)
        self.data = data or GroundwaterData()
        # The licence check lives on the gateway, not here, so deleting a line
        # from this repository buys nobody the answer.
        self.gateway = gateway or GatewayClient()

    # -- ACP ---------------------------------------------------------------

    def new_session(self, session) -> dict:
        session.remember("agent", "Groundwater session opened. " + HELP.splitlines()[0])
        return {}

    def prompt(self, ctx: SessionContext, prompt: list[dict]) -> str:
        text = prompt_text(prompt)
        skill, params = route(text)
        ctx.plan([
            (f"Route the request ({skill})", "high"),
            ("Read USGS's water API", "medium"),
            ("Report the depth, the dates and the spread", "medium"),
        ])

        if skill == "help":
            ctx.stream_text(HELP)
            ctx.message("Depths are feet below land surface, so bigger means deeper.")
            return STOP_END_TURN

        tool = f"call_{skill.replace('-', '_')}"
        ctx.tool_call(tool, "Read USGS's water API", kind="fetch", name=skill,
                      raw_input=dict(params))
        if not ctx.ask_permission(tool, "Allow Groundwater to read USGS's public water data?",
                                  remember_key=PERMISSION_KEY):
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content("permission denied"))
            ctx.message("I need permission to read USGS's water data first.")
            return STOP_REFUSAL
        ctx.tool_call_update(tool, status="in_progress")

        try:
            if skill == "groundwater-trends":
                return self._run_skill(ctx, params, tool)
            if skill == "groundwater-well":
                well = self.data.well(params["identifier"], days=params.get("days") or 14)
                body = render_well(well)
                summary = (f"{well['name']}: {well['latest']['depth_ft']:g} ft on "
                           f"{well['latest']['date']}")
            else:
                overview = self.data.state(params["state"], days=params.get("days") or 7,
                                           limit=params.get("limit") or 200)
                body = render_state(overview)
                summary = (f"{overview['state']}: {overview['wells']} well(s), median "
                           f"{overview['median_ft']:g} ft")
        except (GroundwaterError, GatewayError, ValueError) as exc:
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content(str(exc)))
            ctx.message(f"I could not read USGS's water data: {exc}")
            return STOP_END_TURN

        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message(f"\nSource: {DATASET}, read live. A larger number means a *deeper* water "
                    "table, because the measurement is feet down from the land surface. Readings "
                    "are provisional until USGS approves them, and many wells only report during "
                    "the growing season, so a quiet well is normal.")
        return STOP_END_TURN

    def _run_skill(self, ctx: SessionContext, params: dict, tool: str) -> str:
        """The premium skill. The licence is checked on the gateway, not here."""
        arguments: dict = {"location_id": params["identifier"]}
        days = params.get("days")
        if days:
            arguments["days"] = int(days)

        data, refused = premium_call(self.gateway, "groundwater_trends", arguments,
                                    {"agent": "groundwater"})
        if refused:
            # Already an (answer, artifact) pair, worded by the gateway.
            answer, artifact = refused
            ctx.tool_call_update(tool, status="completed",
                                 content=ctx.text_content(artifact["summary"]))
            ctx.stream_text(answer + "\n")
            ctx.message("That is a premium skill, so the answer comes from the licence gateway. "
                        "The wording above is the gateway's own.")
            return STOP_END_TURN

        if not isinstance(data, dict) or not data.get("location_id"):
            answer, artifact = empty_premium_answer(
                "The licence gateway did not send back any trend for that well.", {"agent": "groundwater"})
            ctx.tool_call_update(tool, status="completed",
                                 content=ctx.text_content(artifact["summary"]))
            ctx.stream_text(answer + "\n")
            ctx.message("I could not read a trend out of what the gateway sent.")
            return STOP_END_TURN

        body = render_trend(data)
        summary = (f"{data['location_id']}: {data.get('trend', 'not reported')}, "
                   f"{_num(data.get('rate_per_year_ft'))} ft/year")
        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message(f"\nSource: {data.get('source', DATASET)}, fitted on the licence gateway. A "
                    "larger number means a *deeper* water table, and the fit is a line through the "
                    "readings, not a forecast: a well that was dry half the window says more about "
                    "the gauge than about the aquifer.")
        return STOP_END_TURN

    def on_cancel(self, session) -> None:
        return None  # one read, one answer


def main(argv=None) -> int:
    import logging

    logging.basicConfig(level=logging.INFO, stream=sys.stderr,
                        format="%(asctime)s %(levelname)s %(name)s %(message)s")
    try:
        GroundwaterAgent().run()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
