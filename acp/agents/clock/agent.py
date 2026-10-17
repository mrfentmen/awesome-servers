"""Clock - what time it is somewhere, which zone a place is in, and when to meet.

timeapi.io publishes the current wall clock in any IANA timezone, keyless, and the
IANA database that ships with Python turns a city name into a zone. Nobody asks that
of an editor. "what time is it in Tokyo?" gets the wall clock, the offset and the
daylight flag; "find me a 45 minute slot this week that works for London, Tokyo and
New York" is the question a clock read cannot answer, and that one goes to the
licence gateway.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from acp_kit import STOP_END_TURN, STOP_REFUSAL, AcpAgent, SessionContext, prompt_text

from data import (DATASET, NAMELESS_ZONE_SAMPLES, ClockData, ClockError,  # noqa: E402
                  ClockNotFound, available_zones, zone_from_text, zones_in_order)

HELP = (
    "I read the current time in any IANA timezone (timeapi.io, keyless) and resolve place names "
    "against the IANA timezone database. Ask me:\n"
    "  - what time is it in Tokyo?\n"
    "  - what time is it in London and Santiago?\n"
    "  - what is the timezone for Santiago?\n"
    "  - how many timezones are there?\n"
    "Find a 45 minute slot this week that works for London, Tokyo and New York. (not implemented here)\n"
    "I can resolve a place only when the IANA zone is named after a city, which is most of them: "
    "`Asia/Tokyo`, `America/Santiago`, `Europe/London`. Zones like `Asia/Qatar` have no city in "
    "the name, so name the zone itself for those.\n"
    "Two independent clocks are read - the time feed's wall clock and this machine's IANA "
    "database - and the answer says when they agree, because a silent pick between two "
    "disagreeing clocks would be worse than saying they differ."
)

PERMISSION_KEY = "clock-read-timeapi"

SKILLS = ("clock-now", "clock-compare", "clock-zone", "clock-zones", "clock-meet", "help")

#: A meeting: several places, a length, and a word that says the question is when
#: something can happen rather than what time it is.
_MEET_WORDS = re.compile(
    r"\b(meet|meeting|call|slot|window|schedule|book|arrange|when can|"
    r"find (?:a|me|us)|suitable|free for|available for|overlap|"
    r"overlapping|conf\w*)\b", re.IGNORECASE)

#: A length for the meeting: "45 minute", "1 hour", "half an hour".
_MINUTES_RE = re.compile(r"\b(\d{1,3})\s*(?:minutes?|mins?)\b", re.IGNORECASE)
_HOURS_RE = re.compile(r"\b(\d{1,2})\s*(?:hours?|hrs?)\b", re.IGNORECASE)
_HALF_HOUR_RE = re.compile(r"\bhalf an hour\b", re.IGNORECASE)

#: "what is the timezone for X" is a zone question, not a clock reading, even
#: though it names a place.
_ZONE_QUESTION = re.compile(
    r"\b(timezone|time zone|which zone|what zone|utc offset|offset|"
    r"which time)\b", re.IGNORECASE)

#: A question about one reading is not a meeting, and these keep the free skills.
_READING_WORDS = re.compile(
    r"\b(now|right now|currently|at the moment|current time|"
    r"time is it|what time|timezone|time zone|utc)\b", re.IGNORECASE)


def route(text: str) -> tuple[str, dict]:
    """Deterministic intent routing: (skill, params). Pure function, easy to test."""
    stripped = str(text or "").strip()
    if not stripped or re.search(r"\b(help|what can you do|commands?)\b", stripped, re.IGNORECASE):
        return "help", {}

    # A count of the database is a real question and costs no call.
    if re.search(r"\b(how many|list|show|every|all)\b[^.?]{0,24}\b(timezones?|time zones?|"
                 r"zones?)\b", stripped, re.IGNORECASE) and not zone_from_text(stripped):
        return "clock-zones", {}

    places = zones_in_order(stripped)
    if places:
        params = {"zones": [zone for zone, _city in places],
                  "cities": [city for _zone, city in places]}
        minutes = _meeting_minutes(stripped)
        if minutes and len(places) >= 2 and _MEET_WORDS.search(stripped) \
                and not _READING_WORDS.search(stripped):
            return "clock-meet", {**params, "minutes": minutes}
        if _ZONE_QUESTION.search(stripped):
            return "clock-zone", params
        if len(places) >= 2:
            return "clock-compare", params
        return "clock-now", params
    return "help", {}


def _meeting_minutes(text: str) -> int | None:
    """A stated meeting length in minutes, or None when there is none."""
    minutes = _MINUTES_RE.search(text)
    if minutes:
        return int(minutes.group(1))
    hours = _HOURS_RE.search(text)
    if hours:
        return int(hours.group(1)) * 60
    if _HALF_HOUR_RE.search(text):
        return 30
    return None


def _show(value) -> str:
    """A value for a line of text, or the honest 'not reported'."""
    if value is None or value == "":
        return "not reported"
    if isinstance(value, bool):
        return "yes" if value else "no"
    try:
        return f"{float(value):g}"
    except (TypeError, ValueError):
        return str(value)


def render_now(reading: dict) -> str:
    """One zone's current time."""
    lines = [f"{reading['city']} ({reading['zone']}) is {reading['feed_time']} on "
             f"{reading['feed_date']} ({reading['day_of_week']})."]
    lines.append(f"  UTC offset: {reading['offset']}"
                 + (f" ({_offset_words(reading['offset_minutes'])})"
                    if reading["offset_minutes"] is not None else ""))
    lines.append(f"  summer time in force there right now: {_show(reading['dst_active'])}")
    lines.append(f"  that is {_show(reading['utc_now'])} in UTC")
    if reading.get("matches_feed") is not None:
        lines.append("  the time feed and this machine's IANA database agree to the minute"
                     if reading["matches_feed"] else
                     "  the time feed and this machine's IANA database DISAGREE by a minute or "
                     "more, which usually means this machine's tzdata is out of date")
    lines.append(f"  source: {reading['source']}")
    return "\n".join(lines)


def _offset_words(minutes) -> str:
    """A UTC offset in words, for the line a reader skims."""
    try:
        total = int(minutes)
    except (TypeError, ValueError):
        return "offset not reported"
    if total == 0:
        return "same as UTC"
    ahead = "ahead of" if total > 0 else "behind"
    total = abs(total)
    return f"{total // 60} h {total % 60:02d} min {ahead} UTC" if total % 60 \
        else f"{total // 60} h {ahead} UTC"


def render_compare(readings: list[dict]) -> str:
    """Several zones at once, in the order they were asked."""
    lines = [f"the time in {len(readings)} places, right now:"]
    for reading in readings:
        lines.append(f"  {reading['city']:<22} {reading['feed_time']} "
                     f"{reading['day_of_week'][:3]}  offset {reading['offset']}  "
                     f"summer time {_show(reading['dst_active'])}  ({reading['zone']})")
    if len(readings) >= 2:
        first, last = readings[0], readings[-1]
        gap = _gap_minutes(first, last)
        if gap is not None:
            lines.append(f"  the widest spread here is {first['city']} to {last['city']}: "
                         f"{_duration_words(gap)}")
    lines.append("  the offsets are read at the moment of this answer, so a zone that changes "
                 "its daylight saving between now and the time you are asking about will move.")
    return "\n".join(lines)


def _gap_minutes(a: dict, b: dict) -> int | None:
    if a.get("offset_minutes") is None or b.get("offset_minutes") is None:
        return None
    return abs(int(a["offset_minutes"]) - int(b["offset_minutes"]))


def _duration_words(minutes: int) -> str:
    """Minutes as hours and minutes, or just minutes."""
    if minutes < 60:
        return f"{minutes} min"
    return f"{minutes // 60} h {minutes % 60:02d} min" if minutes % 60 \
        else f"{minutes // 60} h"


def render_zone(zones: list[str], cities: list[str]) -> str:
    """Which zone a place is in, and what that means."""
    lines = [f"the timezone for {', '.join(cities)}:"]
    for zone, city in zip(zones, cities):
        lines.append(f"  {city}: {zone}")
    lines.append("  a place resolves only when the IANA zone is named after a city, which is "
                 "most of them. Zones with no city in the name have to be written out: "
                 + ", ".join(NAMELESS_ZONE_SAMPLES[:5]) + ", and others like those.")
    lines.append(f"  this machine's IANA database holds {len(available_zones())} zones.")
    return "\n".join(lines)


def render_zones_list(rows: list[dict]) -> str:
    """A count and a sample of the database."""
    lines = [f"this machine's IANA timezone database holds {rows['count']} zones."]
    lines.append("  a sample, with the city each zone is named after:")
    for row in rows["sample"]:
        lines.append(f"    {row['zone']:<34} {row['city']}")
    lines.append(f"  source: {rows['source']}")
    return "\n".join(lines)


def render_meet(data: dict) -> str:
    """The premium answer: the slots that work for everyone."""
    lines = [f"slots that work for all {len(data.get('zones') or [])} of you, "
             f"{_show(data.get('minutes'))} minutes long, over the next "
             f"{_show(data.get('days'))} day(s):"]
    for zone in data.get("zones") or []:
        lines.append(f"  {zone.get('city', '?')} ({zone.get('zone', '?')}): offset "
                     f"{zone.get('offset', 'not reported')}, summer time "
                     f"{_show(zone.get('dst_active'))}")
    slots = data.get("slots") or []
    if not slots:
        lines.append(f"  no {_show(data.get('minutes'))} minute slot works for everyone in "
                     f"{_show(data.get('days'))} day(s)")
        if data.get("reason"):
            lines.append(f"    {data['reason']}")
    for slot in slots[:8]:
        lines.append(f"  {slot.get('start_local')} to {slot.get('end_local')} UK time, "
                     f"{slot.get('start_utc')} to {slot.get('end_utc')} UTC")
        for who in slot.get("local") or []:
            lines.append(f"      {who.get('city')}: {who.get('local')}")
    span = data.get("span")
    if span is not None and len(data.get("zones") or []) >= 2:
        lines.append(f"  your offsets span {_duration_words(int(span))} on the widest day, "
                     "which is what decides whether a meeting is possible at all")
    lines.append(f"  source: {data.get('source', 'not reported')}")
    return "\n".join(lines)


class ClockAgent(AcpAgent):
    name = "clock"
    title = "Clock - what time it is somewhere, and when to meet across timezones"
    version = "1.0.0"

    def __init__(self, connection=None, data: ClockData | None = None,
                 gateway=None) -> None:
        super().__init__(connection)
        self.data = data or ClockData()
        self.gateway = gateway

    # -- ACP ---------------------------------------------------------------

    def new_session(self, session) -> dict:
        session.remember("agent", "Clock session opened. " + HELP.splitlines()[0])
        return {}

    def prompt(self, ctx: SessionContext, prompt: list[dict]) -> str:
        text = prompt_text(prompt)
        skill, params = route(text)
        ctx.plan([
            (f"Route the request ({skill})", "high"),
            ("Read the time feed and the IANA database", "medium"),
            ("Report the time, the zone or the slots", "medium"),
        ])

        if skill == "help":
            ctx.stream_text(HELP)
            ctx.message("Two independent clocks, and the answer says when they disagree.")
            return STOP_END_TURN

        tool = f"call_{skill.replace('-', '_')}"
        label = ("Ask about the meeting slots" if skill == "clock-meet"
                 else "Read the time feed and the IANA database")

        # Answered before the permission gate because it reads nothing off the
        # network: asking permission to fetch a feed for a question that fetches
        # nothing is a prompt the caller cannot make sense of.
        if skill == "clock-zones":
            zones = available_zones()
            ctx.tool_call(tool, "Read this machine's IANA timezone database", kind="fetch",
                          name=skill, raw_input=dict(params))
            body = render_zones_list({
                "count": len(zones),
                "sample": [{"zone": name, "city": name.split("/")[-1].replace("_", " ")}
                           for name in zones[::37][:14]],
                "source": DATASET,
            })
            summary = f"{len(zones)} IANA zones in this machine's database"
            ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
            ctx.stream_text(body + "\n")
            ctx.message("\nSource: this machine's IANA timezone database. It costs no call, and it "
                        "is the source that turns a city name into a zone, because the time feed "
                        "has neither a list of zones nor a reverse lookup.")
            return STOP_END_TURN

        ctx.tool_call(tool, label, kind="fetch", name=skill, raw_input=dict(params))
        if not ctx.ask_permission(tool, "Allow Clock to read the public time feed?",
                                  remember_key=PERMISSION_KEY):
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content("permission denied"))
            ctx.message("I need permission to read the public time feed first.")
            return STOP_REFUSAL
        ctx.tool_call_update(tool, status="in_progress")

        try:
            if skill == "clock-meet":
                return self._run_skill(ctx, params, tool)

            zones = params["zones"]
            cities = params["cities"]
            if skill == "clock-zone":
                body = render_zone(zones, cities)
                summary = f"{cities[0]} is in {zones[0]}"
            else:
                readings = self.data.compare(zones)
                if skill == "clock-compare":
                    body = render_compare(readings)
                    first = readings[0]
                    summary = (f"{len(readings)} places: {first['city']} {first['feed_time']} "
                               f"({first['offset']})")
                else:
                    body = render_now(readings[0])
                    summary = (f"{readings[0]['city']} {readings[0]['feed_time']} "
                               f"({readings[0]['offset']})")
        except (ClockError, ValueError) as exc:
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content(str(exc)))
            ctx.message(f"I could not read the time: {exc}")
            return STOP_END_TURN

        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message("\nSource: timeapi.io for the wall clock, and the IANA timezone database for "
                    "the UTC offset and the daylight-saving flag. Every offset here is the one in "
                    "force right now, so a zone that changes its clocks between now and the "
                    "meeting you have in mind will be a different number on the day.")
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
        ClockAgent().run()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
