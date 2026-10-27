"""Boston - when the next Red Line train is, what is broken, and how long you will wait.

MBTA publishes every Red Line arrival, every service alert and the whole published
timetable at api-v3.mbta.com, keyless. Nobody asks it from an editor. "when is the
next Red Line train from Park Street?" should get the next three arrivals with the
direction they are going, and "how long do I actually wait at 8am?" - the question
a timetable cannot answer - is the one that goes to the licence gateway.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from acp_kit import STOP_END_TURN, STOP_REFUSAL, AcpAgent, SessionContext, prompt_text

from data import (DATASET, RED_LINE_STOPS, BostonData, BostonError,  # noqa: E402
                  BostonNotFound, station_from_text)

HELP = (
    "I read the MBTA's public API (keyless) for the Red Line: live arrivals, service alerts, "
    "station records and the published timetable. Ask me:\n"
    "  - when is the next Red Line train from Park Street?\n"
    "  - any alerts on the Red Line right now?\n"
    "  - what is Alewife's station record?\n"
    "  - which stations are on the Red Line?\n"
    "  - how many trains leave South Station each hour of the day?\n"
    "How long do I actually wait for a train at Park Street at 8am, and what is the worst gap? "
    "(not implemented here)\n"
    "An arrival's `status` is MBTA's own late flag, and `arrival_uncertainty` is how many minutes "
    "either side of that time the train may actually land.\n"
    "Only the Red Line is covered, and only its 22 stations: MBTA rate-limits a keyless caller hard "
    "enough that paging the whole network returns HTTP 429."
)

PERMISSION_KEY = "boston-read-mbta-v3"

SKILLS = ("boston-next", "boston-alerts", "boston-station", "boston-stations",
          "boston-timetable", "boston-wait", "help")

#: How long you actually wait for a train: the question the timetable holds but
#: does not answer on its own. Narrow on purpose - a station and a wait word, and
#: nothing else. "when is the next train" and "any alerts" carry no wait word, so
#: they stay with the free skills.
_WAIT_WORDS = re.compile(
    r"\b(how long (?:do|will|does) (?:i|we|you)? ?(?:wait|does it take|is the wait|until)|"
    r"how long until|wait time|waiting time|headway|headways|how often|how frequent|"
    r"frequency|gap|gaps|worst gap|busiest|peak|peak hours?|off-?peak|crowded|packed|"
    r"rush hour|how crowded|service frequency|minutes between)\b",
    re.IGNORECASE,
)

#: Wording that names the queue rather than the timetable. These must not reach
#: the wait skill, so they are checked and the free skill wins.
_NEXT_WORDS = re.compile(
    r"\b(next|arriv\w*|due|coming|when is the (?:next|first)|right now|schedule\w*|"
    r"timetable|per hour|how many trains)\b",
    re.IGNORECASE,
)

_ALERT_WORDS = re.compile(r"\b(alert|alerts|disruption|disruptions|closure|closures|"
                          r"detour|detours|shuttle|service change|problem|problems|"
                          r"broken|delay|delays|late|maintenance|suspend\w*|stopped|"
                          r"skipping|rescheduled)\b", re.IGNORECASE)

#: A count-of-trains question, which is a timetable count the free skill answers.
_COUNT_WORDS = re.compile(r"\b(how many trains|per hour of the day|each hour|"
                          r"by hour|hourly)\b", re.IGNORECASE)

_STATION_LIST_WORDS = re.compile(
    r"\b(which|what|list|name|show)\b[^.?]{0,20}\b(stations?|stops?)\b|"
    r"\bstations? (?:are )?(?:on|along|of|in) the (?:red line|line)\b", re.IGNORECASE)


def route(text: str) -> tuple[str, dict]:
    """Deterministic intent routing: (skill, params). Pure function, easy to test."""
    stripped = str(text or "").strip()
    if not stripped or re.search(r"\b(help|what can you do|commands?)\b", stripped, re.IGNORECASE):
        return "help", {}

    station = station_from_text(stripped)
    stop_id = station[0] if station else None
    params: dict = {"stop_id": stop_id} if stop_id else {}

    if _STATION_LIST_WORDS.search(stripped) and not stop_id:
        return "boston-stations", {}
    # A station-record question names one station and asks what it is.
    if stop_id and re.search(r"\b(record|details?|info|information|about|located|where|"
                             r"address|wheelchair|coordinates?)\b", stripped, re.IGNORECASE):
        return "boston-station", params
    # A question about the whole week of departures is a count, and the free
    # timetable answer is the count. Checked before the wait skill so that
    # "how many trains leave at 8am" is never read as "how long do I wait".
    if _COUNT_WORDS.search(stripped) or re.search(r"\b(leave|depart\w*|leaves|departs)\b",
                                                  stripped, re.IGNORECASE):
        return "boston-timetable", params
    if _ALERT_WORDS.search(stripped) and not _WAIT_WORDS.search(stripped):
        return "boston-alerts", params
    if not stop_id and _ALERT_WORDS.search(stripped) and re.search(
            r"\b(red line|the line|whole line|system|anywhere)\b", stripped, re.IGNORECASE):
        return "boston-alerts", {}
    # The wait skill: a station plus a wait word, and no "next train" wording. A
    # bare wait word with no station is not answerable, so it falls to help.
    if stop_id and _WAIT_WORDS.search(stripped) and not _NEXT_WORDS.search(stripped):
        return "boston-wait", params
    if stop_id:
        return "boston-next", params
    # A train question with no station in it is a real question with a piece
    # missing, so it reaches the reader and comes back naming what is missing,
    # rather than being answered with the help text as if nothing was asked.
    if re.search(r"\b(train|trains|arrivals?|next|predictions?|departures?|service)\b",
                 stripped, re.IGNORECASE):
        return "boston-next", params
    return "help", {}


def _when(iso: str) -> str:
    """`2026-09-28T23:02:20-04:00` -> `23:02`, the local time the rider reads."""
    match = re.match(r"\d{4}-\d{2}-\d{2}T(\d{2}:\d{2})", str(iso or ""))
    return match.group(1) if match else str(iso or "not reported")


def _num(value) -> str:
    """A number for a line of text, or the honest 'not reported'."""
    if value is None or value == "":
        return "not reported"
    try:
        return f"{float(value):g}"
    except (TypeError, ValueError):
        return str(value)


def render_next(stop_id: str, rows: list[dict]) -> str:
    """The next few arrivals, with the direction each one is going."""
    lines = [f"next Red Line trains at {_station(stop_id)}:"]
    for row in rows:
        when = _when(row["arrival_time"])
        late = " [MBTA says LATE]" if row.get("status") == 1 else ""
        uncertainty = row.get("arrival_uncertainty_min")
        spread = (f", +/-{uncertainty} min" if isinstance(uncertainty, int) and uncertainty else "")
        last = ", last train" if row.get("last_trip") else ""
        lines.append(f"  {when} to {row['destination']} (direction {row['direction_id']})"
                     f"{spread}{late}{last}")
    return "\n".join(lines)


def render_stop(station: dict) -> str:
    """One station's own record."""
    lines = [f"{station['name']} ({station['id']})"]
    if station.get("municipality"):
        lines.append(f"  municipality: {station['municipality']}")
    if station.get("address"):
        lines.append(f"  address: {station['address']}")
    if station.get("latitude") is not None and station.get("longitude") is not None:
        lines.append(f"  coordinates: {float(station['latitude']):.5f}, "
                     f"{float(station['longitude']):.5f}")
    boarding = station.get("wheelchair_boarding")
    if boarding is not None:
        #: MBTA codes 1 as accessible boarding, 0 as not, and publishes nothing else.
        lines.append(f"  wheelchair boarding: {'yes' if boarding == 1 else 'no'}")
    position = next((index for index, pair in enumerate(RED_LINE_STOPS)
                     if pair[0] == station["id"]), None)
    if position is not None:
        lines.append(f"  Red Line: stop {position + 1} of {len(RED_LINE_STOPS)}, "
                     f"counting from Alewife")
    return "\n".join(lines)


def render_alerts(where: str, rows: list[dict]) -> str:
    """Service alerts for one station, or for the line."""
    if not rows:
        return (f"MBTA has no service alert on {where} right now. An empty list is the good "
                "answer: it means no published disruption, not that nothing is wrong.")
    lines = [f"MBTA alerts on {where} ({len(rows)}):"]
    for row in rows:
        header = row.get("header") or row.get("short_header") or "no header published"
        lines.append(f"  [{_effect(row)}] {header}")
        if row.get("description"):
            lines.append(f"    {row['description'][:400]}")
        start, end = row.get("active_from"), row.get("active_until")
        if start and end:
            lines.append(f"    active: {start[:16].replace('T', ' ')} to "
                         f"{end[:16].replace('T', ' ')}")
        elif start:
            lines.append(f"    active from: {start[:16].replace('T', ' ')}")
        if row.get("url"):
            lines.append(f"    {row['url']}")
    return "\n".join(lines)


def render_stations(rows: list[dict]) -> str:
    """The line, in order."""
    lines = ["Red Line stations, counting from Alewife:"]
    for row in rows:
        ends = " (terminus)" if row["terminal"] else ""
        lines.append(f"  {row['position']:02d}. {row['name']} ({row['id']}){ends}")
    return "\n".join(lines)


def render_timetable(table: dict) -> str:
    """The published week, as departures per hour of day."""
    hours = table["departures_by_hour"]
    lines = [f"published Red Line departures from {table['name']}, by hour of day:"]
    lines.append(f"  {table['rows']} departure(s) in the published timetable"
                 + (", capped at the first page" if table["truncated"] else ""))
    if not hours:
        lines.append("  MBTA published no departures by hour.")
        return "\n".join(lines)
    busiest = max(hours.items(), key=lambda pair: (pair[1], pair[0]))
    quietest = min(hours.items(), key=lambda pair: (pair[1], pair[0]))
    lines.append(f"  busiest hour: {busiest[0]}:00 with {busiest[1]} departure(s)")
    lines.append(f"  quietest hour: {quietest[0]}:00 with {quietest[1]} departure(s)")
    for hour in sorted(hours):
        count = hours[hour]
        lines.append(f"    {hour}:00  {'#' * min(count, 30)} {count}")
    lines.append(f"  first departure of the day: {table['earliest']}, "
                 f"last: {table['latest']}")
    return "\n".join(lines)


def render_wait(data: dict) -> str:
    """The premium answer: the wait you actually get, hour by hour."""
    by_hour = data.get("median_headway_min") or {}
    worst = data.get("worst_gap") or {}
    peak = data.get("peak_hour") or {}
    lines = [f"{data.get('station', 'not reported')} - how long a Red Line wait really is, "
             f"from the published timetable"]
    lines.append(f"  timetable read: {data.get('rows_used', 0)} departure(s) over "
                 f"{_num(data.get('days_covered'))} day(s) of timetable")
    if peak:
        lines.append(f"  busiest hour: {peak.get('hour')}:00, median wait "
                     f"{_num(peak.get('median_gap_min'))} min "
                     f"({_num(peak.get('departures'))} departures)")
    if worst:
        lines.append(f"  worst single gap: {_num(worst.get('minutes'))} min at {worst.get('hour')}:00")
    quiet = data.get("quiet_hour") or {}
    if quiet:
        lines.append(f"  quietest hour: {quiet.get('hour')}:00, median wait "
                     f"{_num(quiet.get('median_gap_min'))} min")
    now = data.get("right_now") or {}
    if now.get("next_arrival"):
        lines.append(f"  right now: next train at {now['next_arrival']}, "
                     f"{_num(now.get('next_gap_min'))} min behind the one before it, "
                     f"to {now.get('next_destination')}")
    else:
        lines.append(f"  right now: {_num(now.get('note'))}")
    if by_hour:
        lines.append("  median wait by hour:")
        for hour in sorted(by_hour):
            lines.append(f"    {hour}:00  {_num(by_hour[hour])} min")
    alerts = data.get("alerts") or []
    lines.append(f"  service alerts touching this station right now: {len(alerts)}")
    for row in alerts[:3]:
        lines.append(f"    [{row.get('effect') or 'ALERT'}] "
                     f"{row.get('short_header') or row.get('header') or 'no header published'}")
    lines.append(f"  source: {data.get('source', 'not reported')}")
    return "\n".join(lines)


def _station(stop_id: str) -> str:
    for pair_id, name in RED_LINE_STOPS:
        if pair_id == stop_id:
            return name
    return stop_id


def _effect(row: dict) -> str:
    effect = str(row.get("effect") or "").upper()
    severity = row.get("severity")
    suffix = f" severity {severity}" if severity is not None else ""
    return f"{effect or 'ALERT'}{suffix}"


class BostonAgent(AcpAgent):
    name = "boston"
    title = "Boston - Red Line arrivals, alerts, and how long the wait really is"
    version = "1.0.0"

    def __init__(self, connection=None, data: BostonData | None = None,
                 gateway=None) -> None:
        super().__init__(connection)
        self.data = data or BostonData()
        self.gateway = gateway

    # -- ACP ---------------------------------------------------------------

    def new_session(self, session) -> dict:
        session.remember("agent", "Boston session opened. " + HELP.splitlines()[0])
        return {}

    def prompt(self, ctx: SessionContext, prompt: list[dict]) -> str:
        text = prompt_text(prompt)
        skill, params = route(text)
        ctx.plan([
            (f"Route the request ({skill})", "high"),
            ("Read MBTA's public API", "medium"),
            ("Report the arrivals, the alerts or the wait", "medium"),
        ])

        if skill == "help":
            ctx.stream_text(HELP)
            ctx.message("Only the Red Line, and only its 22 stations. MBTA 429s a keyless "
                        "caller that pages the whole network.")
            return STOP_END_TURN

        tool = f"call_{skill.replace('-', '_')}"
        label = ("Ask about the wait profile" if skill == "boston-wait"
                 else "Read MBTA's public API")
        ctx.tool_call(tool, label, kind="fetch", name=skill, raw_input=dict(params))
        if not ctx.ask_permission(tool, "Allow Boston to read the MBTA's public data?",
                                  remember_key=PERMISSION_KEY):
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content("permission denied"))
            ctx.message("I need permission to read the MBTA's public data first.")
            return STOP_REFUSAL
        ctx.tool_call_update(tool, status="in_progress")

        if skill == "boston-stations":
            body = render_stations(self.data.stations())
            summary = f"{len(RED_LINE_STOPS)} Red Line stations, from Alewife to Braintree"
            ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
            ctx.stream_text(body + "\n")
            ctx.message(f"\nSource: {DATASET}. The station list is fixed, so this answer costs no "
                        "call at all.")
            return STOP_END_TURN

        try:
            if skill == "boston-wait":
                return self._run_skill(ctx, params, tool)
            stop_id = params.get("stop_id")
            if skill == "boston-alerts":
                #: A line-wide alert question names no station, and gets the whole line.
                rows = self.data.alerts(stop_id)
                where = _station(stop_id) if stop_id else "the Red Line"
                body = render_alerts(where, rows)
                summary = f"{where}: {len(rows)} alert(s)"
            elif not stop_id:
                raise ValueError("name a Red Line station, for example Park Street or South Station")
            elif skill == "boston-next":
                rows = self.data.predictions(stop_id, limit=6)
                body = render_next(stop_id, rows)
                summary = (f"{_station(stop_id)}: next train {_when(rows[0]['arrival_time'])} "
                           f"to {rows[0]['destination']}")
            elif skill == "boston-station":
                station = self.data.stop(stop_id)
                body = render_stop(station)
                summary = f"{station['name']}, {station.get('municipality') or 'Boston'}"
            else:
                table = self.data.timetable(stop_id)
                body = render_timetable(table)
                hours = table["departures_by_hour"]
                busiest = max(hours.items(), key=lambda pair: (pair[1], pair[0]))[0] if hours else "?"
                summary = f"{_station(stop_id)}: busiest hour {busiest}:00"
        except BostonNotFound as exc:
            #: The feed answered; it simply has nothing for this query - no train in the
            #: next few hours, or no timetable rows. The Red Line does not run overnight,
            #: so an empty board at 04:00 is the truth and is not a read failure.
            ctx.tool_call_update(tool, status="completed", content=ctx.text_content(str(exc)))
            ctx.message(f"The MBTA answered, but published nothing for that. {exc}")
            return STOP_END_TURN
        except (BostonError, ValueError) as exc:
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content(str(exc)))
            ctx.message(f"I could not read the MBTA's public data: {exc}")
            return STOP_END_TURN

        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message(f"\nSource: {DATASET}, read live. A prediction is not a promise: MBTA's own "
                    "arrival_uncertainty is how many minutes either side of that time the train may "
                    "actually land, and status 1 means MBTA expects the train to be behind schedule.")
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
        BostonAgent().run()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
