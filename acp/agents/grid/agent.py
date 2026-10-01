"""UK grid - how green the electricity is right now, and when to use it.

The National Grid publishes the carbon intensity of the whole UK grid every half
hour, with a three-day forecast and a per-region breakdown, keyless at
api.carbonintensity.org.uk. Nobody asks it from an editor. "how green is the UK grid
right now?" gets the current reading and what is being burned to make it; "when is
the cleanest window in the next two days?" is the question a list of forecast rows
cannot answer, and that one goes to the licence gateway.
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

from data import (DATASET, FUELS, INDEX_ORDER, UNIT, GridData, GridError,  # noqa: E402
                  GridNotFound)

HELP = (
    "I read the UK National Grid carbon intensity API (keyless). Ask me:\n"
    "  - how green is the UK grid right now?\n"
    "  - what is the grid burning right now?\n"
    "  - what does the forecast look like today?\n"
    "  - which region of the UK is the dirtiest right now?\n"
    "When is the cleanest window in the next two days, and when is the dirtiest? (premium - a "
    "forecast list cannot answer it)\n"
    "Everything is grams of CO2 per kilowatt-hour, straight from the feed: 0 is a zero-carbon "
    "minute, 400 or more is a coal minute. The index words (very low to very high) are the "
    "feed's own.\n"
    "Timestamps are converted to UK clock time, because the feed publishes UTC only and a row "
    "stamped 23:30Z is half past eleven at night in London in winter.\n"
    "A per-region forecast is not offered: the feed's regional forecast endpoint needs a token "
    "and answers HTTP 400 without one, so you get the per-region reading now and the national "
    "forecast."
)

PERMISSION_KEY = "grid-read-carbon-intensity"

SKILLS = ("grid-now", "grid-mix", "grid-forecast", "grid-regions", "grid-window", "help")

#: When to use the electricity: a window question. It needs a length, because the
#: answer is a *run* of slots, and a run with no length is not a window.
_WINDOW_WORDS = re.compile(
    r"\b(window|best|worst|cleanest|dirtiest|greenest|should i|when should|"
    r"cheapest to run|good time|best time|run the|run my|run a|"
    r"longest|shortest run)\b", re.IGNORECASE)

#: A length in the question: "next 2 hours", "a 3 hour window", "90 minutes",
#: "in two days". Spelled numbers are here because "in two days" is how people
#: actually ask this and a digits-only pattern would not see it.
_NUMBER_WORDS = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6,
                 "seven": 7, "eight": 8, "nine": 9, "ten": 10, "twelve": 12,
                 "eighteen": 18, "twenty-four": 24, "forty-eight": 48}
_DURATION_RE = re.compile(
    r"\b(\d{1,3}|" + "|".join(_NUMBER_WORDS) + r")\s*"
    r"(hours?|hrs?|h|minutes?|mins?|m|days?|d)\b", re.IGNORECASE)

#: A single reading is not a window, and these keep the free skills.
_SINGLE_WORDS = re.compile(
    r"\b(now|right now|currently|at the moment|burning|burn|mix|combustib\w*|"
    r"region|regional|north|south|east|west|wales|scotland|london|midlands|"
    r"what does the forecast|does the forecast|forecast look|forecast looks|outlook)\b",
    re.IGNORECASE)


def route(text: str) -> tuple[str, dict]:
    """Deterministic intent routing: (skill, params). Pure function, easy to test."""
    stripped = str(text or "").strip()
    if not stripped or re.search(r"\b(help|what can you do|commands?)\b", stripped, re.IGNORECASE):
        return "help", {}

    hours = _duration_hours(stripped)
    if _WINDOW_WORDS.search(stripped) and hours and not _SINGLE_WORDS.search(stripped):
        return "grid-window", {"hours": hours}

    if re.search(r"\b(burning|burn|mix|combustib\w*|fuel|fuels|make it with|"
                 r"coal|wind|solar|nuclear|gas|hydro|biomass)\b", stripped, re.IGNORECASE):
        return "grid-mix", {}
    if re.search(r"\b(region|regions|regional|which part|where in the uk|"
                 r"dirtiest region|cleanest region|north|south|east|west|wales|"
                 r"scotland|london|midlands)\b", stripped, re.IGNORECASE):
        return "grid-regions", {}
    if re.search(r"\b(forecast|look|looks|today|tonight|tomorrow|"
                 r"outlook|coming)\b", stripped, re.IGNORECASE):
        return "grid-forecast", {"days": _forecast_days(stripped)}
    if re.search(r"\b(grid|carbon|co2|intensity|green|greenness|clean|dirty|"
                 r"emissions?)\b", stripped, re.IGNORECASE):
        return "grid-now", {}
    return "help", {}


def _duration_hours(text: str) -> float | None:
    """A stated length as hours, rounded up to the half hour the feed publishes in.

    The feed is half-hourly, so a length that is not a whole number of hours is
    rounded **up** to the next slot rather than down: a "90 minute window" has to
    be answered with three slots, or the answer would cover less time than asked.
    """
    match = _DURATION_RE.search(str(text or ""))
    if not match:
        return None
    raw = match.group(1).lower()
    value = _NUMBER_WORDS.get(raw) if not raw.isdigit() else int(raw)
    if not value or value <= 0:
        return None
    unit = match.group(2).lower()
    if unit.startswith("d"):
        minutes = value * 24 * 60
    elif unit.startswith("h"):
        minutes = value * 60
    else:
        minutes = value
    slots = -(-minutes // 30)  # ceil to the next half hour
    return min(slots * 0.5, 48.0)


def _forecast_days(text: str) -> int:
    """How many days of forecast the question asked for, 1 to 4.

    The day count is read straight off the duration rather than through
    `_duration_hours`, which caps at 48 hours and would turn "the next 3 days"
    into two.
    """
    match = _DURATION_RE.search(str(text or ""))
    if match:
        raw = match.group(1).lower()
        value = _NUMBER_WORDS.get(raw) if not raw.isdigit() else int(raw)
        unit = match.group(2).lower()
        if value and value > 0:
            #: Hours and minutes are converted up to days; a duration already in
            #: days is not divided again, which is what turned "3 days" into one.
            if unit.startswith("h"):
                days = value / 24
            elif unit.startswith("m") and not unit.startswith("mo"):
                days = value / (24 * 60)
            else:
                days = value
            return max(1, min(4, int(round(days))))
    return 1


def _show(value) -> str:
    """A number for a line of text, or the honest 'not reported'."""
    if value is None or value == "":
        return "not reported"
    try:
        return f"{float(value):g}"
    except (TypeError, ValueError):
        return str(value)


def _mix_line(mix: dict) -> str:
    """The generation mix, biggest fuel first, with the zeros left out but named."""
    if not mix:
        return "no generation mix published"
    live = [(fuel, value) for fuel, value in mix.items() if value]
    dead = [fuel for fuel, value in mix.items() if value == 0]
    parts = [f"{fuel} {value}%" for fuel, value in sorted(live, key=lambda pair: -pair[1])]
    line = ", ".join(parts) if parts else "every fuel at 0%"
    if dead:
        line += f" (at 0%: {', '.join(dead)})"
    return line


def render_now(reading: dict, mix: dict | None) -> str:
    """The current national reading."""
    lines = [f"the UK grid right now, at {reading['local_time']} UK time "
             f"({reading['uk_offset']}):"]
    lines.append(f"  carbon intensity: {_show(reading['actual'])} {reading['unit']} "
                 f"measured, {_show(reading['forecast'])} forecast")
    lines.append(f"  the feed calls that: {reading['index']}")
    lines.append(f"  window: {reading['from']} to {reading['to']} (UTC)")
    if mix is not None:
        lines.append(f"  generation mix: {_mix_line(mix['mix'])}")
    lines.append(f"  source: {reading['source']}")
    return "\n".join(lines)


def render_mix(mix: dict) -> str:
    """What the grid is burning right now."""
    lines = [f"what the UK grid is making right now, at {mix['local_time']} UK time:"]
    lines.append(f"  {_mix_line(mix['mix'])}")
    fossil = sum(value or 0 for fuel, value in mix["mix"].items()
                 if fuel in ("coal", "gas", "other"))
    renewable = sum(value or 0 for fuel, value in mix["mix"].items()
                    if fuel in ("biomass", "hydro", "solar", "wind"))
    low_carbon = sum(value or 0 for fuel, value in mix["mix"].items()
                     if fuel in ("biomass", "hydro", "solar", "wind", "nuclear"))
    lines.append(f"  fossil: {fossil:.1f}% (coal, gas, other)")
    lines.append(f"  renewable: {renewable:.1f}% (biomass, hydro, solar, wind)")
    lines.append(f"  low carbon including nuclear: {low_carbon:.1f}%")
    lines.append("  imports are reported by the feed and are deliberately left out of the "
                 "three sums above: an import is a transfer, not a fuel, and which side of "
                 "the border generates it is not in this feed.")
    lines.append(f"  source: {mix['source']}")
    return "\n".join(lines)


def render_forecast(forecast: dict) -> str:
    """The published national forecast, grouped by day."""
    lines = [f"UK grid carbon intensity forecast, {forecast['start']} to {forecast['end']} "
             f"({forecast['count']} half-hourly slots):"]
    lines.append(f"  {forecast['not_yet_happened']} slot(s) have not happened yet, so their "
                 f"figure is a forecast; {forecast['measured']} have a measured reading")
    by_day: dict[str, list[dict]] = {}
    for slot in forecast["slots"]:
        day = str(slot["from"])[:10]
        by_day.setdefault(day, []).append(slot)
    for day in sorted(by_day):
        slots = by_day[day]
        values = [slot["forecast"] for slot in slots if slot["forecast"] is not None]
        measured = [slot["actual"] for slot in slots if slot["actual"] is not None]
        if values:
            lines.append(f"  {day}: {_show(min(values))}-{_show(max(values))} forecast "
                         f"{forecast['unit']}, first slot {slots[0]['local_time']} UK")
        if measured:
            lines.append(f"    measured so far: {_show(min(measured))}-{_show(max(measured))} "
                         f"{forecast['unit']}")
    lines.append(f"  source: {forecast['source']}")
    return "\n".join(lines)


def render_regions(regions: dict) -> str:
    """The per-region breakdown, cleanest first."""
    lines = [f"carbon intensity by UK region at {regions['local_time']} UK time:"]
    national = regions.get("national")
    if national is not None:
        lines.append(f"  the whole grid (GB): {_show(national['forecast'])} {regions['unit']}, "
                     f"index {national['index']}")
    lines.append("  cleanest first:")
    for region in regions["regions"]:
        lines.append(f"    {region['short_name']}: {_show(region['forecast'])} {regions['unit']}"
                     f", index {region['index']}")
    cleanest = regions["regions"][0]
    dirtiest = regions["regions"][-1]
    if regions["count"] > 1 and cleanest["forecast"] is not None and dirtiest["forecast"] is not None:
        lines.append(f"  spread: {dirtiest['short_name']} is "
                     f"{_show(dirtiest['forecast'] - cleanest['forecast'])} {regions['unit']} "
                     f"dirtier than {cleanest['short_name']}")
    #: The list carries the national row and the four country rows alongside the
    #: regions, so the count in this sentence is derived rather than written down.
    national_rows = [entry for entry in regions["regions"]
                     if entry["short_name"] in ("GB", "England", "Scotland", "Wales")]
    listed = regions["count"] - len(national_rows)
    lines.append(f"  the national figure is the GB row the feed publishes, not the average of "
                 f"the {listed} grid regions: a zero-carbon North Scotland and a coal-fired South "
                 "West England do not average into the GB number, and pretending otherwise "
                 "would invent one.")
    lines.append(f"  source: {regions['source']}")
    return "\n".join(lines)


def render_window(data: dict) -> str:
    """The premium answer: the cleanest and dirtiest runs in the window."""
    lines = [f"when to use the UK grid over the next {_show(data.get('hours'))} hour(s), "
             f"from {data.get('start', 'not reported')} to {data.get('end', 'not reported')}:"]
    lines.append(f"  read {_show(data.get('slots_used'))} half-hourly slot(s) from a forecast "
                 f"the feed publishes")
    for key, label in (("cleanest", "cleanest run"), ("dirtiest", "dirtiest run")):
        run = data.get(key) or {}
        if not run.get("start"):
            lines.append(f"  {label}: not found in that window")
            continue
        lines.append(f"  {label}: {run['start_local']} to {run['end_local']} UK time "
                     f"({_show(run['hours'])} h)")
        lines.append(f"    {run['start']} to {run['end']} (UTC)")
        lines.append(f"    average {_show(run['average'])} {data.get('unit', UNIT)}, worst slot "
                     f"in it {_show(run['worst'])}")
        lines.append(f"    the feed calls that {run['index']}")
        if run.get("mix"):
            lines.append(f"    mix then: {_mix_line(run['mix'])}")
    swing = data.get("swing")
    if swing is not None:
        lines.append(f"  the whole window swings {swing:.0f} {data.get('unit', UNIT)} from the "
                     f"cleanest average to the dirtiest average")
    lines.append(f"  source: {data.get('source', 'not reported')}")
    return "\n".join(lines)


class GridAgent(AcpAgent):
    name = "grid"
    title = "UK grid - how green the electricity is, and when to use it"
    version = "1.0.0"

    def __init__(self, connection=None, data: GridData | None = None,
                 gateway=None) -> None:
        super().__init__(connection)
        self.data = data or GridData()
        # The licence check lives on the gateway, not here, so deleting a line
        # from this repository buys nobody the answer.
        self.gateway = gateway or GatewayClient()

    # -- ACP ---------------------------------------------------------------

    def new_session(self, session) -> dict:
        session.remember("agent", "Grid session opened. " + HELP.splitlines()[0])
        return {}

    def prompt(self, ctx: SessionContext, prompt: list[dict]) -> str:
        text = prompt_text(prompt)
        skill, params = route(text)
        ctx.plan([
            (f"Route the request ({skill})", "high"),
            ("Read the National Grid carbon intensity API", "medium"),
            ("Report the reading, the mix or the window", "medium"),
        ])

        if skill == "help":
            ctx.stream_text(HELP)
            ctx.message("One half hour of data, updated every half hour.")
            return STOP_END_TURN

        tool = f"call_{skill.replace('-', '_')}"
        label = ("Ask the licence gateway for the clean and dirty windows"
                 if skill == "grid-window" else "Read the National Grid carbon intensity API")
        ctx.tool_call(tool, label, kind="fetch", name=skill, raw_input=dict(params))
        if not ctx.ask_permission(tool, "Allow Grid to read the National Grid's public data?",
                                  remember_key=PERMISSION_KEY):
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content("permission denied"))
            ctx.message("I need permission to read the National Grid's public data first.")
            return STOP_REFUSAL
        ctx.tool_call_update(tool, status="in_progress")

        try:
            if skill == "grid-window":
                return self._run_skill(ctx, params, tool)

            if skill == "grid-mix":
                mix = self.data.generation_now()
                body = render_mix(mix)
                live = sum(1 for value in mix["mix"].values() if value)
                summary = f"{live} fuels publishing a share at {mix['local_time']} UK time"
            elif skill == "grid-forecast":
                forecast = self.data.forecast(params.get("days") or 1)
                body = render_forecast(forecast)
                summary = (f"{forecast['count']} forecast slot(s) from {forecast['start']}, "
                           f"{forecast['not_yet_happened']} not yet happened")
            elif skill == "grid-regions":
                regions = self.data.regions()
                body = render_regions(regions)
                summary = (f"{regions['count']} regions, cleanest {regions['regions'][0]['short_name']} "
                           f"at {_show(regions['regions'][0]['forecast'])}")
            else:
                reading = self.data.now()
                try:
                    mix = self.data.generation_now()
                except GridError:
                    #: A second feed call must not lose the first one: the intensity
                    #: reading is the answer and the mix is a bonus.
                    mix = None
                body = render_now(reading, mix)
                summary = (f"{_show(reading['actual'])} {reading['unit']} now, index "
                           f"{reading['index']}")
        except (GridError, GatewayError, ValueError) as exc:
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content(str(exc)))
            ctx.message(f"I could not read the National Grid's data: {exc}")
            return STOP_END_TURN

        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message(f"\nSource: {DATASET}, read live, in {UNIT}. Lower is cleaner: 0 is a "
                    "zero-carbon half hour and 400 or more is a coal half hour. A slot with no "
                    "measured figure has not happened yet, and is a forecast rather than a gap.")
        return STOP_END_TURN

    def _run_skill(self, ctx: SessionContext, params: dict, tool: str) -> str:
        """The premium skill. The licence is checked on the gateway, not here."""
        data, refused = premium_call(self.gateway, "grid_clean_window",
                                    {"hours": float(params["hours"])}, {"agent": "grid"})
        if refused:
            # Already an (answer, artifact) pair, worded by the gateway.
            answer, artifact = refused
            ctx.tool_call_update(tool, status="completed",
                                 content=ctx.text_content(artifact["summary"]))
            ctx.stream_text(answer + "\n")
            ctx.message("That is a premium skill, so the answer comes from the licence gateway. "
                        "The wording above is the gateway's own.")
            return STOP_END_TURN

        if not isinstance(data, dict) or not data.get("cleanest"):
            answer, artifact = empty_premium_answer(
                "The licence gateway did not send back a window for that length.",
                {"agent": "grid"})
            ctx.tool_call_update(tool, status="completed",
                                 content=ctx.text_content(artifact["summary"]))
            ctx.stream_text(answer + "\n")
            ctx.message("I could not read a window out of what the gateway sent.")
            return STOP_END_TURN

        body = render_window(data)
        cleanest = data.get("cleanest") or {}
        summary = (f"cleanest {data.get('hours')} h window: {cleanest.get('start_local')} to "
                   f"{cleanest.get('end_local')} UK, avg {_show(cleanest.get('average'))} "
                   f"{data.get('unit', UNIT)}")
        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message("\nSource: the National Grid forecast, worked out on the licence gateway. This "
                    "is a forecast the feed published, not a measurement: weather and demand move, "
                    "and the cleanest hour of a forecast is the hour that was cleanest when the "
                    "forecast was made. Shifting a load by half an hour inside the same window "
                    "will not change much, and the direction of the advice is the durable part.")
        return STOP_END_TURN

    def on_cancel(self, session) -> None:
        return None  # one read, one answer


def main(argv=None) -> int:
    import logging

    logging.basicConfig(level=logging.INFO, stream=sys.stderr,
                        format="%(asctime)s %(levelname)s %(name)s %(message)s")
    try:
        GridAgent().run()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
