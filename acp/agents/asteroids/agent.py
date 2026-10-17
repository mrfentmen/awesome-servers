"""Asteroids - what is coming close to Earth, and how close that really is.

NASA publishes every near-Earth object with a close approach, keyless, and nobody asks
it from an editor. "which asteroids pass Earth this week?" lists them day by day with
the miss distance, the size and NASA's own hazard flag, and "how big is 2026 AB?" looks
one object up. Whether an object has come this close before, and how its whole
approach history compares, is a separate skill.
"""

from __future__ import annotations

import datetime
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from acp_kit import STOP_END_TURN, STOP_REFUSAL, AcpAgent, SessionContext, prompt_text

from data import (DATASET, MAX_DAYS, AsteroidData, AsteroidError,  # noqa: E402
                  AsteroidRateLimited, designation_in, window_dates)

HELP = (
    "I read NASA's Near-Earth Object feed (keyless via DEMO_KEY, 30 requests an hour). Ask me:\n"
    "  - which asteroids pass Earth this week?\n"
    "  - any hazardous asteroids passing this month?\n"
    "  - how big is 2026 AB?\n"
    "  - tell me about 523934\n"
    "NASA's feed lists only objects that come *close* in the window, so an empty answer\n"
    "means nothing is scheduled to pass closely, not that nothing is up there. And the\n"
    "feed takes at most 7 days at a time, so a longer window is asked for in 7-day\n"
    "steps and every step is reported.\n"
    "A miss distance in the answer is how close it passes, not how big it would be if it\n"
    "hit: nothing here is an impact prediction. NASA also rate-limits the shared demo\n"
    "key, so a 429 is answered as itself rather than retried.\n"
    "The full approach history - has this object ever come this close before - is a\n"
    "premium skill."
)

PERMISSION_KEY = "asteroids-read-nasa-neo-feed"

SKILLS = ("asteroids-window", "asteroids-hazardous", "asteroids-lookup",
          "asteroids-approach-history", "help")

_ASTEROID_WORDS = re.compile(r"\b(asteroid|asteroids|neo|neos|near[- ]earth|meteoroid|"
                             r"meteor|close approach|close approaches|pass(es|ing)? earth|"
                             r"near miss|impact|impacts|hazardous|pha|sentry|"
                             r"approaches earth|comes close|come (?:this|that) close|"
                             r"ever come close|closest ever|space rock|rock)\b",
                             re.IGNORECASE)
_HAZARD_WORDS = re.compile(r"\b(hazardous|dangerous|danger|threat|threats|risky|"
                           r"pha|impact risk|will it hit|going to hit)\b", re.IGNORECASE)
_DAYS_RE = re.compile(r"\b(?:next|coming|past|last|over the (?:next|last|past))\s+"
                      r"(\d{1,3})\s*(day|days|week|weeks)\b", re.IGNORECASE)
_WEEK_RE = re.compile(r"\bthis (week|month|year)\b", re.IGNORECASE)
_OTHER_WORDS = re.compile(r"\b(weather forecast|tide|earthquake|stock price|crypto|"
                          r"water table|stargazing|satellite)\b", re.IGNORECASE)

#: A question about whether an object has come this close *before*: its whole approach
#: history, its closest-ever pass, a risk ranking. The free skills print what NASA
#: lists inside one window and say so. Nothing else is premium.
_HISTORY_WORDS = re.compile(
    r"\b(history|historical|ever|before|previous|previous approach|closest ever|"
    r"ever been|come this close|come that close|compared|compare|rank|ranking|"
    r"ranked|how risky|risk|riskiest|sentry|risk list|worst|most dangerous|"
    r"closest approach ever|how often)\b",
    re.IGNORECASE,
)


def span_from_text(text: str) -> dict:
    """The date window the question asks for, never more than 7 days."""
    working = str(text or "")
    days_match = _DAYS_RE.search(working)
    days = 7
    if days_match:
        amount = int(days_match.group(1))
        days = amount * 7 if days_match.group(2).lower().startswith("week") else amount
    elif re.search(r"\bthis month\b|\blast month\b", working, re.IGNORECASE):
        days = MAX_DAYS
    start, end = window_dates(days=max(1, min(days, MAX_DAYS)))
    #: The span actually asked for, not the span requested: NASA caps a request at 7 days
    #: and the answer must not claim a longer window than it read.
    span = (datetime.date.fromisoformat(end) - datetime.date.fromisoformat(start)).days + 1
    return {"start_date": start, "end_date": end, "days": span, "asked_for_days": days}


def route(text: str) -> tuple[str, dict]:
    """Deterministic intent routing: (skill, params). Pure function, easy to test."""
    stripped = str(text or "").strip()
    if not stripped or re.search(r"\b(help|what can you do|commands?)\b", stripped, re.IGNORECASE):
        return "help", {}
    if _OTHER_WORDS.search(stripped) and not _ASTEROID_WORDS.search(stripped):
        return "help", {}

    window = span_from_text(stripped)
    wanted = designation_in(stripped)
    history = _HISTORY_WORDS.search(stripped)

    # Checked first, and narrow on purpose: the record of past approaches, or a
    # ranking across the window. A plain "what passes this week" and a plain "how big
    # is 2026 AB" fall through to the free skills below.
    if history and _ASTEROID_WORDS.search(stripped):
        params: dict = dict(window)
        if wanted:
            params["designation"] = wanted
        return "asteroids-approach-history", params

    if _HAZARD_WORDS.search(stripped) and _ASTEROID_WORDS.search(stripped):
        return "asteroids-hazardous", dict(window)

    if wanted and not _ASTEROID_WORDS.search(stripped):
        return "asteroids-lookup", {"designation": wanted, **window}

    if _ASTEROID_WORDS.search(stripped):
        return "asteroids-window", dict(window)
    return "help", {}


def _num(value, digits: int = 2) -> str:
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


def _size(row: dict) -> str:
    """An object's size. NASA reports an estimated range, so both ends are kept."""
    low, high = row.get("diameter_km_min"), row.get("diameter_km_max")
    if low and high:
        return f"{_num(low, 3)}-{_num(high, 3)} km across"
    if row.get("diameter_km"):
        return f"about {_num(row['diameter_km'], 3)} km across"
    return "size not reported"


def _miss(closest: dict) -> str:
    """How close it passes, in every unit NASA published, plus the Moon for scale."""
    parts = [f"{_num(closest.get('miss_km'), 0)} km"]
    if closest.get("miss_au") is not None:
        parts.append(f"{_num(closest.get('miss_au'), 4)} AU")
    if closest.get("miss_lunar") is not None:
        parts.append(f"{_num(closest.get('miss_lunar'), 2)} Moon distances")
    return ", ".join(parts)


def render_row(row: dict) -> str:
    """One object: how close it comes, how big it is, and NASA's own flags."""
    lines = [f"{row['name']}" + (f"  ({row['designation']})" if row.get("designation") else "")]
    lines.append(f"  closest approach {row['approach_date']}: {_miss(row['closest'])}")
    if row["closest"].get("velocity_km_s") is not None:
        lines.append(f"  relative speed: {_num(row['closest']['velocity_km_s'])} km/s "
                     f"({_num(row['closest'].get('velocity_km_h'), 0)} km/h)")
    lines.append(f"  size: {_size(row)}"
                 + (f", absolute magnitude {_num(row['absolute_magnitude_h'])}"
                    if row.get("absolute_magnitude_h") is not None else ""))
    flags = []
    if row.get("hazardous"):
        flags.append("potentially hazardous")
    if row.get("sentry"):
        flags.append("on the Sentry risk list")
    lines.append("  NASA flags: " + (", ".join(flags) if flags else "neither hazardous nor sentry"))
    if row.get("jpl_url"):
        lines.append(f"  {row['jpl_url']}")
    return "\n".join(lines)


def render_window(overview: dict, hazardous_only: bool = False) -> str:
    """A window of close approaches, day by day, nearest first inside each day."""
    which = "potentially hazardous " if hazardous_only else ""
    shown = [row for row in overview["records"] if row["hazardous"] or not hazardous_only]
    if not shown:
        which = "potentially hazardous "
    lines = [f"{which}close approaches NASA lists between {overview['start_date']} and "
             f"{overview['end_date']}"]
    lines.append(f"  {overview['count']} object(s) in the window"
                 + (f", {overview['hazardous']} flagged potentially hazardous"
                    if overview["hazardous"] else "")
                 + (f", {overview['sentry']} on the Sentry list" if overview["sentry"] else ""))
    if hazardous_only:
        lines.append(f"  showing the {len(shown)} hazardous object(s) only; a day with none "
                     f"is left out rather than counted")
    #: The day summary is built from what is actually shown, so a hazardous-only answer
    #: cannot carry a day line whose objects are not in the list under it.
    by_day: dict[str, list[dict]] = {}
    for row in shown:
        by_day.setdefault(row["approach_date"], []).append(row)
    for date in sorted(by_day):
        rows = by_day[date]
        nearest = min((row["closest"]["miss_km"] for row in rows
                       if row["closest"]["miss_km"] is not None), default=None)
        lines.append(f"  {date}: {len(rows)} object(s), closest that day {_num(nearest, 0)} km")
    for row in shown[:12]:
        lines.append(f"    {row['approach_date']}  {row['name']}")
        lines.append(f"      misses by {_miss(row['closest'])}, {_size(row)}"
                     + (", potentially hazardous" if row["hazardous"] else "")
                     + (", on the Sentry list" if row["sentry"] else ""))
    if len(shown) > 12:
        lines.append(f"    ... and {len(shown) - 12} more in the window")
    if not shown:
        lines.append("  NASA flags nothing in this window as potentially hazardous, which is "
                     "not the same as saying the sky is clear - it is a flag, not a forecast")
    lines.append("  a miss distance is how near the object passes, not a prediction of an "
                 "impact; NASA publishes no impact odds here")
    return "\n".join(lines)


def render_history(data: dict) -> str:
    """The approach history: has this come this close before?"""
    lines = [f"Close-approach record, ranked from the objects in "
             f"{data.get('start_date', 'not reported')} to {data.get('end_date', 'not reported')}"]
    lines.append(f"  {data.get('objects_ranked', 0)} object(s) ranked, "
                 f"{data.get('approaches_read', 0)} recorded approach(es) read in total")
    objects = data.get("objects") or []
    if not objects:
        lines.append("  no object in the window had a recorded approach to report")
    for index, row in enumerate(objects[:8], start=1):
        lines.append(f"  {index}. {row.get('name')}"
                     + (f" ({row.get('designation')})" if row.get("designation") else ""))
        lines.append(f"     now: {_num(row.get('window_miss_km'), 0)} km on "
                     f"{row.get('window_approach_date')}")
        lines.append(f"     closest ever: {_num(row.get('closest_ever_km'), 0)} km on "
                     f"{row.get('closest_ever_date')}"
                     + (f", {row.get('years_ago')} years ago"
                        if row.get("years_ago") is not None else ""))
        lines.append(f"     recorded approaches: {_num(row.get('approach_count'))}, "
                     f"from {_num(row.get('first_approach_date'))} to "
                     f"{_num(row.get('last_approach_date'))}")
        lines.append(f"     ever closer than this window: {row.get('been_closer')}")
        lines.append(f"     size {_num(row.get('diameter_km_min'))}-"
                     f"{_num(row.get('diameter_km_max'))} km"
                     + (", potentially hazardous" if row.get("hazardous") else "")
                     + (", on the Sentry list" if row.get("sentry") else ""))
    lines.append(f"  counted past approaches closer than this window's: "
                 f"{_num(data.get('closer_than_window'))} of "
                 f"{_num(data.get('approaches_read'))}")
    lines.append(f"  source: {data.get('source', 'not reported')}")
    return "\n".join(lines)


class AsteroidsAgent(AcpAgent):
    name = "asteroids"
    title = "Asteroids - what is coming close to Earth, and how close"
    version = "1.0.0"

    def __init__(self, connection=None, data: AsteroidData | None = None,
                 gateway=None) -> None:
        super().__init__(connection)
        self.data = data or AsteroidData()
        self.gateway = gateway

    # -- ACP ---------------------------------------------------------------

    def new_session(self, session) -> dict:
        session.remember("agent", "Asteroids session opened. " + HELP.splitlines()[0])
        return {}

    def prompt(self, ctx: SessionContext, prompt: list[dict]) -> str:
        text = prompt_text(prompt)
        skill, params = route(text)
        ctx.plan([
            (f"Route the request ({skill})", "high"),
            ("Read NASA's near-Earth object feed", "medium"),
            ("Report the miss distances, the sizes and NASA's flags", "medium"),
        ])

        if skill == "help":
            ctx.stream_text(HELP)
            ctx.message("The free skills are keyless. Only the approach history is premium.")
            return STOP_END_TURN

        tool = f"call_{skill.replace('-', '_')}"
        ctx.tool_call(tool, "Read NASA's near-Earth object feed", kind="fetch", name=skill,
                      raw_input=dict(params))
        if not ctx.ask_permission(tool, "Allow Asteroids to read NASA's public NEO feed?",
                                  remember_key=PERMISSION_KEY):
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content("permission denied"))
            ctx.message("I need permission to read NASA's NEO feed first.")
            return STOP_REFUSAL
        ctx.tool_call_update(tool, status="in_progress")

        try:
            if skill == "asteroids-approach-history":
                return self._run_skill(ctx, params, tool)
            if skill == "asteroids-lookup":
                row = self.data.lookup(params["designation"], params["start_date"],
                                       params["end_date"])
                body = render_row(row)
                summary = f"{row['name']}: {_size(row)}, misses by {_miss(row['closest'])}"
            else:
                overview = self.data.feed(params["start_date"], params["end_date"])
                body = render_window(overview, hazardous_only=skill == "asteroids-hazardous")
                summary = (f"{overview['start_date']} to {overview['end_date']}: "
                           f"{overview['count']} close approach(es), "
                           f"{overview['hazardous']} hazardous")
        except (AsteroidRateLimited, AsteroidError, ValueError) as exc:
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content(str(exc)))
            ctx.message(f"I could not read NASA's NEO feed: {exc}")
            return STOP_END_TURN

        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message(f"\nSource: {DATASET}, read live. This feed lists only objects that come "
                    f"close inside the window asked for, in steps of at most {MAX_DAYS} days, "
                    f"and a miss distance is how near an object passes rather than a prediction "
                    f"that it will hit. NASA's hazard and Sentry flags are NASA's own, carried "
                    f"through unchanged.")
        return STOP_END_TURN

    def _run_skill(self, ctx: SessionContext, params: dict, tool: str) -> str:
        """Stub: the hosted implementation of this skill was removed in the paywall cleanup."""
        message = 'Not yet implemented: run-skill — its hosted implementation was removed.'
        return message, {"summary": "not implemented", "removed": True}

    def on_cancel(self, session) -> None:
        return None  # one read, one answer


def main(argv=None) -> int:
    import logging

    logging.basicConfig(level=logging.INFO, stream=sys.stderr,
                        format="%(asctime)s %(levelname)s %(name)s %(message)s")
    try:
        AsteroidsAgent().run()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
