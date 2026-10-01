"""Radiation - what a volunteer sensor near a place is reading, right now.

Safecast runs a network of cheap Geiger counters that anyone can put on a windowsill,
and it publishes every reading keyless. "what is the radiation level near Fukushima?"
answers from the sensors actually within the radius, with the distance worked out from
the coordinates and the age of each reading, because a 2013 count rate is not a
reading of today. The rate of change over a window is the premium skill.
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

from data import (DATASET, PAGE_SIZE, RADIATION_UNITS, RadiationData,  # noqa: E402
                  RadiationError, RadiationNotFound, coordinates_from_text,
                  place_from_text)

HELP = (
    "I read Safecast's volunteer radiation network (keyless). Ask me:\n"
    "  - what is the radiation level near Fukushima?\n"
    "  - radiation near 37.23, 140.36\n"
    "  - what do sensors near Chernobyl read?\n"
    "  - what has device 100422 been reading?\n"
    "Every reading comes with the distance from the point you asked about and how old\n"
    "it is. The network is thin and slow, so a quiet answer usually means no sensor\n"
    "within the radius rather than no radiation, and I say which it is.\n"
    "Two honest limits. Safecast publishes counts per minute, and converting a count\n"
    "rate to microsieverts needs that device's own calibration, which Safecast does not\n"
    "publish through this endpoint, so I do not convert. And the feed carries non-\n"
    "radiation rows too - device heartbeats and even air quality - which I drop and\n"
    "count. The rate of change over a window is a premium skill."
)

PERMISSION_KEY = "radiation-read-safecast-measurements"

SKILLS = ("radiation-near", "radiation-window", "radiation-device",
          "radiation-trend", "help")

_RAD_WORDS = re.compile(r"\b(radiation|radiations|radiation level|radiation levels|"
                        r"geiger|geiger counter|counter|counts|cpm|cps|dose rate|"
                        r"irradiation|background level|ambient level|hotspot)\b",
                        re.IGNORECASE)
_DEVICE_RE = re.compile(r"\b(?:device|sensor|detector|unit)\s*(?:id\s*|#\s*|number\s*)?(\d{1,9})\b",
                        re.IGNORECASE)
_RADIUS_RE = re.compile(r"\b(?:within|inside|radius|close to|near(?:by)?)\s+(\d{1,4})\s*"
                        r"(km|kilometres|kilometers|miles|mi)\b", re.IGNORECASE)
#: The count is optional, so 'over the last year' is a window and not a shrug.
_SPAN_RE = re.compile(r"\b(?:over the (?:last|past)|in the (?:last|past)|last|past|since)\s+"
                      r"(\d{1,4})?\s*(day|days|week|weeks|month|months|year|years)\b",
                      re.IGNORECASE)
_DEVICE_ASK = re.compile(r"\b(device|sensor|detector)\b", re.IGNORECASE)
_OTHER_WORDS = re.compile(r"\b(weather forecast|tide|earthquake|stock price|crypto|"
                          r"water table|satellite|asteroid|stargazing)\b", re.IGNORECASE)

#: A question about how the level is *changing*: a rate, a fit, a projection. The free
#: skills print the readings and how far apart in time they are, so a plain "what is
#: the level near X" and a plain "what has device N read" stay free. Nothing else is
#: premium.
_TREND_WORDS = re.compile(
    r"\b(trend|trends|trending|rate|rate of change|how fast|rising|rise|rose|climbing|"
    r"going up|increasing|increasing in|falling|fall|fell|dropping|going down|"
    r"decreasing|decreasing in|per day|per week|per month|per year|slope|"
    r"project|projecting|projection|projected|forecast|extrapolate|where will|"
    r"fit|linear|regression)\b",
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


def radius_from_text(text: str, default_km: float = 100.0) -> float:
    """The radius asked for, in km. Miles are converted, not ignored."""
    match = _RADIUS_RE.search(str(text or ""))
    if not match:
        return default_km
    amount = float(match.group(1))
    return amount * 1.609344 if match.group(2).lower() in ("miles", "mi") else amount


def days_from_text(text: str, default: int | None = None) -> int | None:
    """The time window a question asks for, in days, or None if it names none.

    'over the last 3 days' and 'in the last 2 weeks' become 3 and 14. A question that
    names no window gets None, which is what tells the window skill it was not asked for.
    """
    match = _SPAN_RE.search(str(text or ""))
    if not match:
        return default
    amount = int(match.group(1)) if match.group(1) else 1
    unit = match.group(2).lower().rstrip("s")
    if unit == "day":
        return amount
    if unit == "week":
        return amount * 7
    if unit == "month":
        return amount * 30
    if unit == "year":
        return amount * 365
    return default


def device_from_text(text: str) -> str | None:
    """A Safecast device id, if the question names one."""
    match = _DEVICE_RE.search(str(text or ""))
    return match.group(1) if match else None


def route(text: str) -> tuple[str, dict]:
    """Deterministic intent routing: (skill, params). Pure function, easy to test."""
    stripped = str(text or "").strip()
    if not stripped or re.search(r"\b(help|what can you do|commands?)\b", stripped, re.IGNORECASE):
        return "help", {}
    if _OTHER_WORDS.search(stripped) and not _RAD_WORDS.search(stripped):
        return "help", {}

    device = device_from_text(stripped)
    location = location_from_text(stripped)
    span = days_from_text(stripped)

    # Checked first, and narrow on purpose: a rate, a fit or a projection. A plain
    # "what is the level near X" and a plain "what has device N read" fall through to
    # the free skills below.
    if location and _TREND_WORDS.search(stripped) and not device:
        params: dict = {"latitude": location[0], "longitude": location[1],
                        "label": location[2], "radius_km": radius_from_text(stripped)}
        return "radiation-trend", params

    if device:
        return "radiation-device", {"device_id": device}

    if location:
        params = {"latitude": location[0], "longitude": location[1], "label": location[2],
                  "radius_km": radius_from_text(stripped)}
        #: A named time window is a different question from 'what is it reading now':
        #: it summarises a stretch of days instead of listing the readings near the
        #: point. The rate over that window stays on the gateway.
        if span:
            params["days"] = span
            return "radiation-window", params
        return "radiation-near", params

    if _RAD_WORDS.search(stripped) and not _DEVICE_ASK.search(stripped):
        return "help", {}
    return "help", {}


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


def _age(iso_time) -> str:
    """How old a reading is, in days, because a date alone is hard to judge."""
    import datetime

    text = str(iso_time or "")
    if not text:
        return "time not reported"
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        moment = datetime.datetime.fromisoformat(text)
    except ValueError:
        return f"time unreadable ({iso_time})"
    if not moment.tzinfo:
        moment = moment.replace(tzinfo=datetime.timezone.utc)
    days = (datetime.datetime.now(datetime.timezone.utc) - moment).total_seconds() / 86400.0
    if days < 1:
        return f"{days * 24:.0f} h old"
    if days < 365:
        return f"{days:.0f} days old"
    return f"{days / 365:.1f} years old"


def render_near(found: dict, widened_from: float | None = None) -> str:
    """The readings around a point, nearest first, with their distance and age."""
    lines = [f"Radiation within {_num(found['radius_km'], 0)} km of "
             f"{found['latitude']:.4f}, {found['longitude']:.4f}"]
    if widened_from:
        lines.append(f"  nothing came back within {_num(widened_from, 0)} km, so the search was "
                     f"widened to {_num(found['radius_km'], 0)} km - Safecast's coverage is thin, "
                     f"so these are the nearest sensors, not the ones you asked for")
    inside, outside = found["inside"], [row for row in found["rows"] if not row["inside_radius"]]
    lines.append(f"  {len(inside)} reading(s) inside the radius, {len(outside)} just outside it")
    if found.get("skipped_other_units"):
        lines.append(f"  dropped {found['skipped_other_units']} row(s) that are not radiation "
                     f"(device status, air quality)")
    for row in inside[:12]:
        name = row.get("location_name") or f"device {row.get('device_id') or 'unknown'}"
        unit = RADIATION_UNITS.get(row["unit"], row["unit"])
        lines.append(f"  {_num(row['value'], 1)} {row['unit']} ({unit}) at "
                     f"{_num(row['distance_km'], 1)} km - {name}")
        lines.append(f"    device {row.get('device_id') or 'not reported'}, taken "
                     f"{row.get('captured_at') or 'no time'} ({_age(row.get('captured_at'))})")
    if len(inside) > 12:
        lines.append(f"  ... and {len(inside) - 12} more inside the radius")
    if outside:
        lines.append(f"  nearest just outside: {_num(outside[0]['value'], 1)} "
                     f"{outside[0]['unit']} at {_num(outside[0]['distance_km'], 1)} km")
    newest = found.get("newest") or ""
    lines.append(f"  readings span {found.get('oldest') or 'unknown'} to "
                 f"{newest or 'unknown'}")
    return "\n".join(lines)


def render_device(history: dict) -> str:
    """One device's own history. The summary is over one unit, never over two."""
    lines = [f"Device {history['device_id']}: {history['readings']} radiation reading(s), "
             f"{history['readings_in_unit']} of them in {history['unit']} "
             f"({RADIATION_UNITS.get(history['unit'], history['unit'])})"]
    lines.append(f"  lowest {_num(history['min'])}, highest {_num(history['max'])}, "
                 f"mean {_num(history['mean'])} {history['unit']}")
    other = {name: count for name, count in history["by_unit"].items()
             if name != history["unit"]}
    if other:
        spoken = ", ".join(f"{count} in {name}" for name, count in sorted(other.items()))
        lines.append(f"  kept separate, not averaged in: {spoken} - a count rate and a dose "
                     f"rate are not the same measurement")
    if history.get("skipped_other_units"):
        lines.append(f"  dropped {history['skipped_other_units']} row(s) that are not radiation")
    lines.append(f"  from {history['oldest']} to {history['newest']}")
    for row in history["rows"][-8:]:
        lines.append(f"    {row['captured_at']}: {_num(row['value'])} {row['unit']} "
                     f"({_age(row['captured_at'])})")
    if len(history["rows"]) > 8:
        lines.append(f"    ... and {len(history['rows']) - 8} older reading(s) not shown; a page "
                     f"is {PAGE_SIZE} rows")
    return "\n".join(lines)


def render_window(summary: dict) -> str:
    """A stretch of days around a point: how much, how high, and by whom."""
    other = {name: count for name, count in summary["by_unit"].items()
             if name != summary["unit"]}
    lines = [f"Radiation within {_num(summary['radius_km'], 0)} km of "
             f"{summary['latitude']:.4f}, {summary['longitude']:.4f} over the last "
             f"{summary['days']} day(s)"]
    lines.append(f"  {summary['readings']} reading(s) in {summary['unit']} from "
                 f"{_num(summary['devices'], 0)} device(s)")
    if other:
        spoken = ", ".join(f"{count} in {name}" for name, count in sorted(other.items()))
        lines.append(f"  kept separate, not averaged in: {spoken} - a count rate and a dose "
                     f"rate are not the same measurement")
    if summary.get("skipped_other_units"):
        lines.append(f"  dropped {summary['skipped_other_units']} row(s) that are not radiation")
    lines.append(f"  highest {_num(summary['high'])} {summary['unit']}, "
                 f"lowest {_num(summary['low'])}, median {_num(summary['median'])}")
    top = summary.get("highest_row") or {}
    if top:
        name = top.get("location_name") or f"device {top.get('device_id') or 'unknown'}"
        lines.append(f"  the highest was {_num(top['value'])} {top['unit']} at "
                     f"{_num(top.get('distance_km'), 1)} km - {name}")
        lines.append(f"    device {top.get('device_id') or 'not reported'}, taken "
                     f"{top.get('captured_at') or 'no time'} ({_age(top.get('captured_at'))})")
    lines.append(f"  read {summary['rows_seen']} row(s) from Safecast"
                 + (", and the page cap was reached, so older readings may be missing"
                    if summary.get("truncated") else ""))
    lines.append("  this is what the sensors recorded, not a fitted rate - a slope over the "
                 "same window is the premium skill")
    return "\n".join(lines)


def render_trend(data: dict) -> str:
    """The fitted rate: which way the level is going, and how fast."""
    window = data.get("window") or {}
    spread = data.get("spread") or {}
    projected = data.get("projected_in_30_days") or {}
    lines = [f"{data.get('label', 'not reported')} - radiation fitted over "
             f"{_num(window.get('span_days'))} day(s) of a "
             f"{_num(window.get('days'))}-day window, from "
             f"{data.get('readings_used', 0)} reading(s)"]
    lines.append(f"  point: {_num(data.get('latitude'), 4)}, {_num(data.get('longitude'), 4)}, "
                 f"within {_num(data.get('radius_km'), 0)} km")
    lines.append(f"  direction: {data.get('trend', 'not reported')} at "
                 f"{_num(data.get('rate_per_day'), 4)} {data.get('unit', 'not reported')} a day")
    lines.append(f"  readings: {_num(spread.get('min'))} to {_num(spread.get('max'))} "
                 f"{data.get('unit', 'not reported')}, median {_num(spread.get('median'))}")
    lines.append(f"  if the fitted line holds, {projected.get('date', 'not reported')} would be "
                 f"about {_num(projected.get('value'))} "
                 f"{data.get('unit', 'not reported')} ({projected.get('note', 'not reported')})")
    lines.append(f"  readings on other units were dropped: "
                 f"{_num(data.get('skipped_other_units'))}")
    lines.append(f"  source: {data.get('source', 'not reported')}")
    return "\n".join(lines)


class RadiationAgent(AcpAgent):
    name = "radiation"
    title = "Radiation - what a volunteer sensor near a place is reading"
    version = "1.0.0"

    def __init__(self, connection=None, data: RadiationData | None = None,
                 gateway=None) -> None:
        super().__init__(connection)
        self.data = data or RadiationData()
        # The licence check lives on the gateway, not here, so deleting a line
        # from this repository buys nobody the answer.
        self.gateway = gateway or GatewayClient()

    # -- ACP ---------------------------------------------------------------

    def new_session(self, session) -> dict:
        session.remember("agent", "Radiation session opened. " + HELP.splitlines()[0])
        return {}

    def prompt(self, ctx: SessionContext, prompt: list[dict]) -> str:
        text = prompt_text(prompt)
        skill, params = route(text)
        ctx.plan([
            (f"Route the request ({skill})", "high"),
            ("Read Safecast's measurement feed", "medium"),
            ("Report the readings, the distances and their ages", "medium"),
        ])

        if skill == "help":
            ctx.stream_text(HELP)
            ctx.message("Safecast is keyless. Only the rate of change is premium.")
            return STOP_END_TURN

        tool = f"call_{skill.replace('-', '_')}"
        ctx.tool_call(tool, "Read Safecast's measurement feed", kind="fetch", name=skill,
                      raw_input=dict(params))
        if not ctx.ask_permission(tool, "Allow Radiation to read Safecast's public measurements?",
                                  remember_key=PERMISSION_KEY):
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content("permission denied"))
            ctx.message("I need permission to read Safecast's measurements first.")
            return STOP_REFUSAL
        ctx.tool_call_update(tool, status="in_progress")

        try:
            if skill == "radiation-trend":
                return self._run_skill(ctx, params, tool)
            if skill == "radiation-device":
                history = self.data.device(params["device_id"])
                body = render_device(history)
                summary = (f"device {history['device_id']}: {history['readings']} reading(s), "
                           f"mean {_num(history['mean'])} {history['unit']}")
            elif skill == "radiation-window":
                summary_data = self.data.window(params["latitude"], params["longitude"],
                                                radius_km=params.get("radius_km") or 100.0,
                                                days=params.get("days") or 30)
                body = render_window(summary_data)
                summary = (f"{params['label']}: {summary_data['readings']} reading(s) over "
                           f"{summary_data['days']} d, high {_num(summary_data['high'])} "
                           f"{summary_data['unit']}")
            else:
                found, widened = self._near_with_widening(params)
                body = render_near(found, widened)
                inside = found["inside"]
                summary = (f"{params['label']}: {len(inside)} reading(s) within "
                           f"{_num(found['radius_km'], 0)} km")
        except (RadiationError, GatewayError, ValueError) as exc:
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content(str(exc)))
            ctx.message(f"I could not read Safecast's measurements: {exc}")
            return STOP_END_TURN

        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message(f"\nSource: {DATASET}, read live. Safecast pages are {PAGE_SIZE} rows and the "
                    "network is volunteer-run, so a place with no answer is a coverage fact, not "
                    "a safe reading. Counts per minute are not dose rates: converting one to "
                    "microsieverts needs that detector's own calibration, which this endpoint does "
                    "not publish, so no conversion is invented here.")
        return STOP_END_TURN

    def _near_with_widening(self, params: dict) -> tuple[dict, float | None]:
        """The asked radius, and once - not repeatedly - a wider one if it is empty.

        Safecast's coverage is thin enough that a small radius is often empty. Rather
        than report nothing, the search is widened once and the answer says so.
        """
        asked = float(params.get("radius_km") or 100.0)
        try:
            return self.data.near(params["latitude"], params["longitude"],
                                  radius_km=asked), None
        except RadiationNotFound:
            if asked >= 500.0:
                raise
            found = self.data.near(params["latitude"], params["longitude"], radius_km=500.0)
            return found, asked

    def _run_skill(self, ctx: SessionContext, params: dict, tool: str) -> str:
        """The premium skill. The licence is checked on the gateway, not here."""
        arguments: dict = {"latitude": float(params["latitude"]),
                           "longitude": float(params["longitude"]),
                           "radius_km": float(params.get("radius_km") or 100.0)}

        data, refused = premium_call(self.gateway, "radiation_trend_board", arguments,
                                    {"agent": "radiation"})
        if refused:
            # Already an (answer, artifact) pair, worded by the gateway.
            answer, artifact = refused
            ctx.tool_call_update(tool, status="completed",
                                 content=ctx.text_content(artifact["summary"]))
            ctx.stream_text(answer + "\n")
            ctx.message("That is a premium skill, so the answer comes from the licence gateway. "
                        "The wording above is the gateway's own.")
            return STOP_END_TURN

        if not isinstance(data, dict) or "rate_per_day" not in data:
            answer, artifact = empty_premium_answer(
                "The licence gateway did not send back a trend for that point.",
                {"agent": "radiation"})
            ctx.tool_call_update(tool, status="completed",
                                 content=ctx.text_content(artifact["summary"]))
            ctx.stream_text(answer + "\n")
            ctx.message("I could not read a trend out of what the gateway sent.")
            return STOP_END_TURN

        body = render_trend(data)
        summary = (f"{data.get('label', 'not reported')}: {data.get('trend', 'not reported')} "
                   f"at {_num(data.get('rate_per_day'), 4)} {data.get('unit', '')} a day")
        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message(f"\nSource: {data.get('source', DATASET)}, fitted on the licence gateway. "
                    "The fit is a line through readings from whatever sensors happened to be "
                    "inside the radius, and volunteers move their detectors, so a slope here is "
                    "not a measurement of the place. Rows on other units are dropped before the "
                    "fit, never averaged in.")
        return STOP_END_TURN

    def on_cancel(self, session) -> None:
        return None  # one read, one answer


def main(argv=None) -> int:
    import logging

    logging.basicConfig(level=logging.INFO, stream=sys.stderr,
                        format="%(asctime)s %(levelname)s %(name)s %(message)s")
    try:
        RadiationAgent().run()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
