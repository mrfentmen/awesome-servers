"""Stargazing - whether tonight's sky over a place is worth going out for.

7Timer publishes a 72-hour astronomical forecast for any coordinate, keyless, and it
answers the three questions that decide a night out: how much cloud, how steady the air
is, and how much haze is in the way. "is tonight good for stargazing in New York?"
prints those three per three-hour slot and says which slot is the one to go for. The
ranking and the best window over three days are the premium skill.
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

from data import (DATASET, SLOT_HOURS, StargazingData, StargazingError,  # noqa: E402
                  StargazingNotFound, coordinates_from_text, describe_cloud,
                  describe_seeing, describe_transparency, place_from_text)

HELP = (
    "I read 7Timer's astronomical forecast (keyless, 72 hours of 3-hour slots). Ask me:\n"
    "  - is tonight good for stargazing in New York?\n"
    "  - stargazing at 51.5N, 0.1W\n"
    "  - what is the cloud cover in Chicago tonight?\n"
    "  - compare stargazing in New York and Los Angeles tonight\n"
    "  - three day stargazing forecast for London\n"
    "All three indices run the same way: bigger is better. Cloud cover is 1 (fully\n"
    "covered) to 9 (no cloud at all), so a 1 is the worst night, not the best.\n"
    "This product carries no moon phase, and for faint targets the moon matters more\n"
    "than any of these, so I do not guess at it. The ranked windows over three days\n"
    "are a premium skill."
)

PERMISSION_KEY = "stargazing-read-7timer-astro"

SKILLS = ("stargazing-tonight", "stargazing-forecast", "stargazing-compare",
          "stargazing-best-window", "help")

_SKY_WORDS = re.compile(r"\b(stargazing|stargaze|stargazer|stars|star|astronom|"
                        r"sky|skies|observe|observing|observation|night|tonight|"
                        r"cloud|cloudy|cloud cover|seeing|transparency|haze|"
                        r"moonlight|constellation|milky way|meteor|aurora|"
                        r"telescope|eyepiece|new moon|forecast)\b", re.IGNORECASE)
_HOURS_RE = re.compile(r"\b(?:next|coming|over the next)\s+(\d{1,3})\s*(hours?|h)\b",
                       re.IGNORECASE)
_DAYS_RE = re.compile(r"\b(?:next|coming|over the next|three day|3 day|three day|"
                      r"multi[- ]?day|weekend)\b", re.IGNORECASE)
_COMPARE_WORDS = re.compile(r"\b(compare|versus|vs\.?|against|or)\b", re.IGNORECASE)
_OTHER_WORDS = re.compile(r"\b(water table|earthquake|stock price|crypto|"
                          r"satellite|asteroid|radiation level)\b", re.IGNORECASE)

#: A question asking for the *choice* to be made rather than the conditions printed: a
#: ranking, a best window, a best night. The free skills print the published indices
#: slot by slot, so a plain "is tonight good in New York" and a plain three-day
#: forecast stay with them. Nothing else is premium.
_BEST_WORDS = re.compile(
    r"\b(best|optimal|ideal|clearest|rank|ranking|ranked|which (?:hour|time|slot|night|"
    r"day|evening)|when (?:should|is|would|will)|what time|what night|best window|"
    r"best time|top \d+|pick for me|suggest)\b",
    re.IGNORECASE,
)


def location_from_text(text: str) -> tuple[float, float, str] | None:
    """The point the question is about, as (latitude, longitude, label)."""
    named = place_from_text(text)
    if named:
        return named
    pair = coordinates_from_text(text)
    if pair:
        return pair[0], pair[1], f"{pair[0]:.4f}, {pair[1]:.4f}"
    return None


def hours_from_text(text: str, default: int = 12) -> int:
    """How far ahead the question looks."""
    match = _HOURS_RE.search(str(text or ""))
    if match:
        return max(3, min(int(match.group(1)), 72))
    if _DAYS_RE.search(str(text or "")):
        return 72
    return default


def route(text: str) -> tuple[str, dict]:
    """Deterministic intent routing: (skill, params). Pure function, easy to test."""
    stripped = str(text or "").strip()
    if not stripped or re.search(r"\b(help|what can you do|commands?)\b", stripped, re.IGNORECASE):
        return "help", {}
    if _OTHER_WORDS.search(stripped) and not _SKY_WORDS.search(stripped):
        return "help", {}

    hours = hours_from_text(stripped)
    location = location_from_text(stripped)
    best = _BEST_WORDS.search(stripped)
    #: 'which hour is clearest in London' names no sky word at all, so a question about
    #: the best window counts as a sky question when it names a place.
    if not _SKY_WORDS.search(stripped) and not (best and location):
        return "help", {}

    # Checked first, and narrow on purpose: the choice, not the conditions. A plain
    # "is tonight good in X", a three-day forecast and a two-place comparison all fall
    # through to the free skills below.
    if best:
        params: dict = {"hours": hours}
        if location:
            params["latitude"], params["longitude"] = location[0], location[1]
            params["label"] = location[2]
        return "stargazing-best-window", params

    if _COMPARE_WORDS.search(stripped):
        rows = [entry for entry in (place_from_text(name) for name in _place_names_in(stripped))
                if entry]
        if not rows and location:
            rows = [location]
        if len(rows) >= 2:
            return "stargazing-compare", {"hours": hours,
                                          "places": [{"latitude": r[0], "longitude": r[1],
                                                      "label": r[2]} for r in rows]}
        if rows:
            return "stargazing-tonight", {"latitude": rows[0][0], "longitude": rows[0][1],
                                          "label": rows[0][2], "hours": hours}
        return "help", {}

    if location:
        params = {"latitude": location[0], "longitude": location[1], "label": location[2],
                  "hours": hours}
        if hours >= 72:
            return "stargazing-forecast", params
        return "stargazing-tonight", params

    return "help", {}


def _place_names_in(text: str) -> list[str]:
    """Every place from the table that the question names, in the order it names them."""
    from data import PLACES

    lowered = str(text or "").lower()
    found = [(lowered.index(name), name) for name in PLACES
             if re.search(rf"\b{re.escape(name)}\b", lowered)]
    return [name for _index, name in sorted(found)]


def _num(value, digits: int = 1) -> str:
    """A number for a line of text, or the honest 'not reported'."""
    if value is None or value == "":
        return "not reported"
    try:
        text = f"{float(value):.{digits}f}"
    except (TypeError, ValueError):
        return str(value)
    if "." in text:
        text = text.rstrip("0").rstrip(".")
    return text or "0"


def _when(row: dict) -> str:
    """The slot's own UTC timestamp, or the raw offset when the feed gave no clock."""
    return row.get("utc") or f"+{row.get('timepoint')} h from the run start"


def _verdict(row: dict) -> str:
    """A plain verdict for one slot, from the three published indices alone.

    Bigger is better on all three. The thresholds are stated rather than hidden: cloud
    at 7 or more is the only place "clear" is claimed.
    """
    try:
        cloud = int(row.get("cloudcover"))
        seeing = int(row.get("seeing"))
        transparency = int(row.get("transparency"))
    except (TypeError, ValueError):
        return "not reported"
    wet = "none" not in str(row.get("precipitation") or "none").lower()
    if cloud <= 4:
        return "too cloudy"
    if cloud <= 6:
        return "patchy cloud, only worth it for the Moon"
    if wet:
        return "clear but something is falling"
    if seeing >= 7 and transparency >= 6:
        return "excellent"
    if seeing >= 7 or transparency >= 6:
        return "good"
    if cloud >= 7:
        return "clear but the air is unsteady or hazy"
    return "marginal"


def render_slots(run: dict, rows: list[dict], title: str) -> str:
    """A list of slots with the three indices, each with the index spelled out."""
    lines = [f"{title} - {run['count']} slot(s) of {run['slot_hours']} h from "
             f"{run['started_utc'] or 'a start 7Timer did not report'}"]
    if len(rows) < run["count"]:
        lines.append(f"  showing {len(rows)} of the {run['count']} slot(s) in the run")
    for row in rows:
        lines.append(f"  {_when(row)} UTC  cloud {row.get('cloudcover')} "
                     f"({describe_cloud(row.get('cloudcover'))}), "
                     f"seeing {row.get('seeing')} ({describe_seeing(row.get('seeing'))}), "
                     f"transparency {row.get('transparency')} "
                     f"({describe_transparency(row.get('transparency'))})")
        lines.append(f"    {_verdict(row)} | {_num(row.get('temperature_c'))} C, "
                     f"wind {_num(row.get('wind_speed'))} from {row.get('wind_direction') or 'unknown'}, "
                     f"{row.get('precipitation')}")
    best = max(rows, key=lambda row: (int(row.get("cloudcover") or 0)
                                      + int(row.get("seeing") or 0)
                                      + int(row.get("transparency") or 0)), default=None)
    if best is not None:
        lines.append(f"  best of these slots: {_when(best)} UTC - {_verdict(best)}")
    lines.append("  no moon phase in this product, and the moon matters more than any of "
                 "these three indices for faint targets")
    return "\n".join(lines)


def render_forecast(run: dict, label: str) -> str:
    """The whole run, every slot."""
    return render_slots(run, run["slots"],
                        f"{label} ({run['latitude']:.4f}, {run['longitude']:.4f}) "
                        f"stargazing forecast")


def render_tonight(run: dict, label: str, hours: int) -> str:
    """The coming hours, which is what 'tonight' means."""
    return render_slots(run, run["slots"][:max(1, int(hours) // SLOT_HOURS)],
                        f"{label} over the next {hours} h")


def render_compare(comparison: dict) -> str:
    """Two or more places, ranked by their best slot."""
    lines = [f"Stargazing compared over the next {comparison['hours']} h"]
    for entry in comparison["places"]:
        run = entry["forecast"]
        rows = run["slots"][:max(1, int(comparison["hours"]) // SLOT_HOURS)]
        best = max(rows, key=lambda row: (int(row.get("cloudcover") or 0)
                                          + int(row.get("seeing") or 0)
                                          + int(row.get("transparency") or 0)), default=None)
        clouds = [int(row.get("cloudcover") or 0) for row in rows]
        lines.append(f"  {entry['label']}  ({run['latitude']:.4f}, {run['longitude']:.4f})")
        lines.append(f"    cloud cover in these slots: {min(clouds)} to {max(clouds)} "
                     f"(9 is no cloud at all)")
        if best is not None:
            lines.append(f"    best slot {_when(best)} UTC: cloud {best.get('cloudcover')}, "
                         f"seeing {best.get('seeing')}, "
                         f"transparency {best.get('transparency')} - {_verdict(best)}")
    lines.append("  ranked by the best slot in the window; the three indices are added, "
                 "which is a rough sum and not a published score")
    lines.append("  no moon phase in this product")
    return "\n".join(lines)


def render_best(data: dict) -> str:
    """The ranked observing windows over the whole run."""
    windows = data.get("windows") or []
    lines = [f"Observing windows for {data.get('label', 'not reported')}, ranked from the "
             f"published cloud, seeing and transparency indices"]
    lines.append(f"  {data.get('slots_scored', 0)} slot(s) of {data.get('slot_hours', 3)} h "
                 f"scored, run started {_num(data.get('started_utc'))}")
    if not windows:
        lines.append("  no slot scored above the floor, so there is no window worth naming")
    for index, window in enumerate(windows[:6], start=1):
        lines.append(f"  {index}. {_num(window.get('from_utc'))} to "
                     f"{_num(window.get('to_utc'))} UTC  score "
                     f"{_num(window.get('score'), 2)}")
        lines.append(f"     {_num(window.get('mean_cloudcover'))} cloud, "
                     f"{_num(window.get('mean_seeing'))} seeing, "
                     f"{_num(window.get('mean_transparency'))} transparency, "
                     f"{_num(window.get('length_hours'))} h long")
        lines.append(f"     {_num(window.get('verdict'))}")
    lines.append(f"  score weights: cloud {_num(data.get('weight_cloud'))}, "
                 f"seeing {_num(data.get('weight_seeing'))}, "
                 f"transparency {_num(data.get('weight_transparency'))} - a chosen "
                 f"ranking, not something 7Timer publishes")
    lines.append("  no moon phase in this product, so a bright Moon could spoil a window "
                 "that scores well here")
    return "\n".join(lines)


class StargazingAgent(AcpAgent):
    name = "stargazing"
    title = "Stargazing - is tonight's sky over a place worth going out for"
    version = "1.0.0"

    def __init__(self, connection=None, data: StargazingData | None = None,
                 gateway=None) -> None:
        super().__init__(connection)
        self.data = data or StargazingData()
        # The licence check lives on the gateway, not here, so deleting a line
        # from this repository buys nobody the answer.
        self.gateway = gateway or GatewayClient()

    # -- ACP ---------------------------------------------------------------

    def new_session(self, session) -> dict:
        session.remember("agent", "Stargazing session opened. " + HELP.splitlines()[0])
        return {}

    def prompt(self, ctx: SessionContext, prompt: list[dict]) -> str:
        text = prompt_text(prompt)
        skill, params = route(text)
        ctx.plan([
            (f"Route the request ({skill})", "high"),
            ("Read 7Timer's astronomical forecast", "medium"),
            ("Report the cloud, the seeing and the transparency", "medium"),
        ])

        if skill == "help":
            ctx.stream_text(HELP)
            ctx.message("7Timer is keyless. Only the ranked windows are premium.")
            return STOP_END_TURN

        tool = f"call_{skill.replace('-', '_')}"
        ctx.tool_call(tool, "Read 7Timer's astronomical forecast", kind="fetch", name=skill,
                      raw_input=dict(params))
        if not ctx.ask_permission(tool, "Allow Stargazing to read 7Timer's public forecast?",
                                  remember_key=PERMISSION_KEY):
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content("permission denied"))
            ctx.message("I need permission to read 7Timer's forecast first.")
            return STOP_REFUSAL
        ctx.tool_call_update(tool, status="in_progress")

        try:
            if skill == "stargazing-best-window":
                return self._run_skill(ctx, params, tool)
            if skill == "stargazing-compare":
                places = []
                for entry in params["places"]:
                    run = self.data.forecast(entry["latitude"], entry["longitude"])
                    places.append({"label": entry["label"], "forecast": run})
                body = render_compare({"hours": params["hours"], "places": places})
                summary = (f"{len(places)} place(s) over {params['hours']} h: "
                           + ", ".join(entry["label"] for entry in places))
            elif skill == "stargazing-forecast":
                run = self.data.forecast(params["latitude"], params["longitude"])
                body = render_forecast(run, params["label"])
                summary = (f"{params['label']}: {run['count']} slot(s) over "
                           f"{run['horizon_hours']} h")
            else:
                run = self.data.forecast(params["latitude"], params["longitude"])
                body = render_tonight(run, params["label"], params["hours"])
                summary = (f"{params['label']}: {max(1, params['hours'] // SLOT_HOURS)} "
                           f"slot(s) over {params['hours']} h")
        except (StargazingError, GatewayError, ValueError) as exc:
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content(str(exc)))
            ctx.message(f"I could not read 7Timer's forecast: {exc}")
            return STOP_END_TURN

        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message(f"\nSource: {DATASET}, read live. All three indices run the same way - "
                    "bigger is better - so a low cloud cover is a bad night, not a clear one. "
                    "The product carries no moon phase, and for faint targets that matters more "
                    "than cloud or seeing.")
        return STOP_END_TURN

    def _run_skill(self, ctx: SessionContext, params: dict, tool: str) -> str:
        """The premium skill. The licence is checked on the gateway, not here."""
        arguments: dict = {"hours": int(params.get("hours") or 12)}
        if params.get("latitude") is not None:
            arguments["latitude"] = float(params["latitude"])
            arguments["longitude"] = float(params["longitude"])
            arguments["label"] = str(params.get("label") or "not reported")

        data, refused = premium_call(self.gateway, "stargazing_best_window_board", arguments,
                                    {"agent": "stargazing"})
        if refused:
            # Already an (answer, artifact) pair, worded by the gateway.
            answer, artifact = refused
            ctx.tool_call_update(tool, status="completed",
                                 content=ctx.text_content(artifact["summary"]))
            ctx.stream_text(answer + "\n")
            ctx.message("That is a premium skill, so the answer comes from the licence gateway. "
                        "The wording above is the gateway's own.")
            return STOP_END_TURN

        if not isinstance(data, dict) or "windows" not in data:
            answer, artifact = empty_premium_answer(
                "The licence gateway did not send back any observing windows.",
                {"agent": "stargazing"})
            ctx.tool_call_update(tool, status="completed",
                                 content=ctx.text_content(artifact["summary"]))
            ctx.stream_text(answer + "\n")
            ctx.message("I could not read any windows out of what the gateway sent.")
            return STOP_END_TURN

        body = render_best(data)
        windows = data.get("windows") or []
        summary = (f"{data.get('label', 'not reported')}: {data.get('slots_scored', 0)} slot(s) "
                   f"scored, {len(windows)} window(s)")
        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message(f"\nSource: {data.get('source', DATASET)}, ranked on the licence gateway. "
                    "The score is a weighted sum of the three published indices, and the "
                    "weights are a choice this answer makes and shows - 7Timer does not rank "
                    "anything. Two windows hours apart are not independent, and a bright Moon "
                    "is not in the product at all.")
        return STOP_END_TURN

    def on_cancel(self, session) -> None:
        return None  # one read, one answer


def main(argv=None) -> int:
    import logging

    logging.basicConfig(level=logging.INFO, stream=sys.stderr,
                        format="%(asctime)s %(levelname)s %(name)s %(message)s")
    try:
        StargazingAgent().run()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
