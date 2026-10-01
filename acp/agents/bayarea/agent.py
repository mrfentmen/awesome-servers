"""Bay Area - the next BART train out of a station, and which one to actually get on.

BART publishes its real-time departure board at api.bart.gov, and the demo key its
own documentation hands out answers it keylessly. Nobody asks it from an editor.
"next BART trains from Embarcadero" gets the board with platform, direction and
cars; "if I need to be at Berkeley in 30 minutes, which train should I get on?" is
the question a list of departures cannot answer, and that one goes to the licence
gateway.
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

from data import (BART_STATIONS, DATASET, BartData, BartError,  # noqa: E402
                  BartNotFound, all_stations, station_from_text)

HELP = (
    "I read BART's public departure board (the demo key BART publishes, no key needed). Ask me:\n"
    "  - next BART trains from Embarcadero\n"
    "  - what is on the board at Montgomery St.?\n"
    "  - which BART stations take bikes on the next train from Milpitas?\n"
    "  - which BART stations are there?\n"
    "  - where is EMBR?\n"
    "If I need to get somewhere in 25 minutes, which BART train out of Embarcadero should I get on, "
    "and how much slack do I have? (premium - a board cannot answer it)\n"
    "BART's `delay` is not a flag: it is the number of seconds the feed believes that train is "
    "running behind, so 608 means over ten minutes late, not 'late'.\n"
    "The board is BART's own and it moves, so 'no train' is a real answer and never an error."
)

PERMISSION_KEY = "bayarea-read-bart-board"

SKILLS = ("bayarea-board", "bayarea-bikes", "bayarea-stations", "bayarea-where",
          "bayarea-plan", "help")

#: Which train to get on for a deadline: a station, a time budget, and a word that
#: says the answer is a choice rather than a list. Narrow on purpose. "next train
#: from X" and "what is on the board" carry no time budget, so the free board
#: answers stay free.
_PLAN_WORDS = re.compile(
    r"\b(plan|planning|make it|make my|make the|reach|arrive|arrive by|be there|"
    r"catch|which train should|what should i (?:get|board|take)|should i (?:get|board|take|wait)|"
    r"slack|how long do i have|how much (?:slack|time)|leave now|leave by|"
    r"latest (?:train|one)|last train i can|deadline|"
    r"connection|connect|margin)\b",
    re.IGNORECASE,
)

#: A minutes budget written in a question: "in 25 minutes", "in 1 hour", "90 min".
_MINUTES_RE = re.compile(r"\b(\d{1,3})\s*(?:minutes?|mins?)\b", re.IGNORECASE)
_HOURS_RE = re.compile(r"\b(\d{1,2})\s*(?:hours?|hrs?)\b", re.IGNORECASE)

#: A board listing is not a plan. These keep the free skill.
_BOARD_WORDS = re.compile(
    r"\b(next|due|schedule|upcoming|list|all trains|every train|train times?|"
    r"on the board|what.s on)\b",
    re.IGNORECASE,
)

_BIKE_WORDS = re.compile(
    r"\b(bikes?|bicycles?|cycle|cycles|bike rack|bike space|carriage|cars|length)\b",
    re.IGNORECASE,
)

_STATION_LIST_WORDS = re.compile(
    r"\b(which|what|list|name|show)\b[^.?]{0,20}\b(stations?|stops?)\b|"
    r"\bstations? (?:are )?(?:on|of|in) (?:the )?(?:bart|network|system)\b", re.IGNORECASE)


def route(text: str) -> tuple[str, dict]:
    """Deterministic intent routing: (skill, params). Pure function, easy to test."""
    stripped = str(text or "").strip()
    if not stripped or re.search(r"\b(help|what can you do|commands?)\b", stripped, re.IGNORECASE):
        return "help", {}

    station = station_from_text(stripped)
    params: dict = {"abbr": station[0], "name": station[1]} if station else {}

    if _STATION_LIST_WORDS.search(stripped) and not station:
        return "bayarea-stations", {}
    if station and re.search(r"\b(where|located|location|which platform|platforms?|"
                             r"abbr|abbreviation|code)\b", stripped, re.IGNORECASE):
        return "bayarea-where", params
    # A bike or carriage question is about capacity on the trains that are coming,
    # which the board already carries, so it is free.
    if station and _BIKE_WORDS.search(stripped) and not _PLAN_WORDS.search(stripped):
        return "bayarea-bikes", params

    minutes = _budget_minutes(stripped)
    if station and minutes and _PLAN_WORDS.search(stripped) and not _BOARD_WORDS.search(stripped):
        return "bayarea-plan", {**params, "minutes": minutes}
    if station:
        return "bayarea-board", params
    if re.search(r"\b(train|trains|board|next|bart|platform|bikes?)\b", stripped, re.IGNORECASE):
        return "bayarea-board", params
    return "help", {}


def _budget_minutes(text: str) -> int | None:
    """A time budget in minutes: "25 minutes", "1 hour", "90 min". None if absent."""
    hours = _HOURS_RE.search(text)
    minutes = _MINUTES_RE.search(text)
    if minutes:
        return int(minutes.group(1))
    if hours:
        return int(hours.group(1)) * 60
    return None


def _in_words(minutes) -> str:
    """`0.0` -> "Leaving now", `13.0` -> "in 13 min"."""
    if minutes is None:
        return "no time published"
    if minutes == 0:
        return "leaving now"
    return f"in {minutes:g} min"


def _delay_words(seconds) -> str:
    """BART's delay field, in seconds, as something a rider can read."""
    if seconds is None:
        return "delay not published"
    if seconds == 0:
        return "on time"
    if seconds > 0:
        return f"{round(seconds / 60.0)} min late"
    return f"{round(abs(seconds) / 60.0)} min early"


def _num(value) -> str:
    """A number for a line of text, or the honest 'not reported'."""
    if value is None or value == "":
        return "not reported"
    try:
        return f"{float(value):g}"
    except (TypeError, ValueError):
        return str(value)


def render_board(board: dict) -> str:
    """The departure board, soonest first."""
    lines = [f"next BART trains from {board['name']} "
             f"(board published {board['feed_date']} {board['feed_time']}):"]
    for train in board["trains"]:
        flags = []
        if train.get("cancelled"):
            flags.append("CANCELLED")
        if train.get("limited"):
            flags.append("limited stop")
        if train.get("dynamic"):
            flags.append("schedule in flux")
        platform = f"platform {train['platform']}" if train.get("platform") else "platform not published"
        direction = train.get("direction") or "direction not published"
        cars = f", {train['cars']} cars" if train.get("cars") else ""
        lines.append(f"  {_in_words(train['minutes'])} to {train['destination']} "
                     f"({direction}, {platform}{cars}) - {_delay_words(train['delay_seconds'])}"
                     + (f" [{', '.join(flags)}]" if flags else ""))
    return "\n".join(lines)


def render_bikes(board: dict) -> str:
    """Bikes and carriages on the trains that are coming."""
    lines = [f"bikes and carriages on the next trains from {board['name']}:"]
    for train in board["trains"]:
        if train.get("cancelled"):
            bikes, cars = "not running", "not reported"
        else:
            bikes = ("bikes allowed" if train.get("bikes_allowed")
                     else ("bikes not allowed" if train.get("bikes_allowed") is False
                           else "bike allowance not published"))
            cars = f"{train['cars']} cars" if train.get("cars") else "car count not published"
        lines.append(f"  {_in_words(train['minutes'])} to {train['destination']}: {bikes}, {cars}")
    return "\n".join(lines)


def render_stations(rows: list[dict]) -> str:
    """BART's 50 stations."""
    lines = [f"BART's {len(rows)} stations, with the four-letter code the API wants:"]
    for row in rows:
        lines.append(f"  {row['name']} ({row['abbr']})")
    return "\n".join(lines)


def render_where(abbr: str, name: str, board: dict) -> str:
    """One station: its code, its name, and which platform each direction uses."""
    lines = [f"{name} is BART station {abbr}."]
    if board is not None and board["trains"]:
        platforms: dict[str, set] = {}
        for train in board["trains"]:
            direction = train.get("direction")
            if direction and train.get("platform"):
                platforms.setdefault(direction, set()).add(str(train["platform"]))
        if platforms:
            lines.append("  on the board right now:")
            for direction in sorted(platforms):
                listed = ", ".join(sorted(platforms[direction]))
                lines.append(f"    {direction}-bound trains leave from platform {listed}")
            lines.append("  that is what is published right now, not a standing fact: BART "
                         "reassigns platforms for construction and special events.")
    return "\n".join(lines)


def render_plan(data: dict) -> str:
    """The premium answer: which train to get on, and how much slack there is."""
    lines = [f"{data.get('station', 'not reported')} ({data.get('abbr', 'not reported')}) - "
             f"getting somewhere within {_num(data.get('budget_minutes'))} minute(s)"]
    board = data.get("board") or {}
    lines.append(f"  board published: {board.get('feed_date', 'not reported')} "
                 f"{board.get('feed_time', 'not reported')}")
    catch = data.get("last_catchable") or {}
    if catch.get("minutes") is not None:
        lines.append(f"  last train you can still catch: {_in_words(catch['minutes'])} to "
                     f"{catch.get('destination', 'not reported')}"
                     + (f", platform {catch['platform']}" if catch.get("platform") else ""))
        lines.append(f"    slack: {_num(catch.get('slack_minutes'))} min "
                     f"({_num(catch.get('cars'))} cars, {_delay_words(catch.get('delay_seconds'))})")
    else:
        lines.append(f"  no train on the board gets there inside the budget: "
                     f"{_num(data.get('first_miss_minutes'))} min")
    missed = data.get("first_miss") or {}
    if missed.get("minutes") is not None:
        lines.append(f"  the next one after that is {_in_words(missed['minutes'])} to "
                     f"{missed.get('destination', 'not reported')} - "
                     f"{_num(missed.get('overshoot_minutes'))} min past the budget")
    elif missed.get("note"):
        lines.append(f"  {missed['note']}")
    per_direction = data.get("by_direction") or {}
    if per_direction:
        lines.append("  what the board is running:")
        for direction in sorted(per_direction):
            row = per_direction[direction]
            lines.append(f"    {direction}: {_num(row.get('trains'))} train(s) in the next "
                         f"{_num(data.get('board_minutes'))} min, median gap "
                         f"{_num(row.get('median_gap_min'))} min, longest gap "
                         f"{_num(row.get('max_gap_min'))} min")
    lines.append(f"  board covers the next {_num(data.get('board_minutes'))} min of trains; "
                 f"anything beyond that BART has not published")
    late = data.get("late_trains") or []
    lines.append(f"  trains BART currently reports as behind: {len(late)}")
    for row in late[:4]:
        lines.append(f"    {_in_words(row.get('minutes'))} to {row.get('destination', '?')}: "
                     f"{_delay_words(row.get('delay_seconds'))}")
    lines.append(f"  source: {data.get('source', 'not reported')}")
    return "\n".join(lines)


def _station_name(abbr: str) -> str:
    for pair_abbr, name in BART_STATIONS:
        if pair_abbr == abbr:
            return name
    return abbr


class BayAreaAgent(AcpAgent):
    name = "bayarea"
    title = "Bay Area - BART departures, bikes, and which train to get on for a deadline"
    version = "1.0.0"

    def __init__(self, connection=None, data: BartData | None = None,
                 gateway=None) -> None:
        super().__init__(connection)
        self.data = data or BartData()
        # The licence check lives on the gateway, not here, so deleting a line
        # from this repository buys nobody the answer.
        self.gateway = gateway or GatewayClient()

    # -- ACP ---------------------------------------------------------------

    def new_session(self, session) -> dict:
        session.remember("agent", "Bay Area session opened. " + HELP.splitlines()[0])
        return {}

    def prompt(self, ctx: SessionContext, prompt: list[dict]) -> str:
        text = prompt_text(prompt)
        skill, params = route(text)
        ctx.plan([
            (f"Route the request ({skill})", "high"),
            ("Read BART's departure board", "medium"),
            ("Report the board, the bikes or the plan", "medium"),
        ])

        if skill == "help":
            ctx.stream_text(HELP)
            ctx.message("The board is BART's own and it only ever shows the next few trains.")
            return STOP_END_TURN

        tool = f"call_{skill.replace('-', '_')}"
        label = ("Ask the licence gateway for the plan" if skill == "bayarea-plan"
                 else "Read BART's departure board")
        ctx.tool_call(tool, label, kind="fetch", name=skill, raw_input=dict(params))
        if not ctx.ask_permission(tool, "Allow Bay Area to read BART's public board?",
                                  remember_key=PERMISSION_KEY):
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content("permission denied"))
            ctx.message("I need permission to read BART's public board first.")
            return STOP_REFUSAL
        ctx.tool_call_update(tool, status="in_progress")

        if skill == "bayarea-stations":
            rows = all_stations()
            body = render_stations(rows)
            summary = f"BART's {len(rows)} stations"
            ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
            ctx.stream_text(body + "\n")
            ctx.message(f"\nSource: {DATASET}. The station list is fixed, so this answer costs no "
                        "call. BART's own station list is a separate endpoint and it does wobble, so "
                        "this one is the table the departure board needs.")
            return STOP_END_TURN

        try:
            if skill == "bayarea-plan":
                return self._run_skill(ctx, params, tool)

            abbr = params.get("abbr")
            if not abbr:
                raise ValueError("name a BART station, for example Embarcadero or Milpitas")
            if skill == "bayarea-where":
                body = render_where(abbr, _station_name(abbr), self.data.board(abbr))
                summary = f"{_station_name(abbr)} is BART station {abbr}"
            else:
                board = self.data.board(abbr)
                if skill == "bayarea-bikes":
                    body = render_bikes(board)
                    allowed = sum(1 for train in board["trains"] if train.get("bikes_allowed"))
                    summary = f"{board['name']}: {allowed} of {len(board['trains'])} take bikes"
                else:
                    body = render_board(board)
                    first = board["trains"][0]
                    summary = (f"{board['name']}: next {_in_words(first['minutes'])} to "
                               f"{first['destination']}")
        except (BartError, GatewayError, ValueError) as exc:
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content(str(exc)))
            ctx.message(f"I could not read BART's board: {exc}")
            return STOP_END_TURN

        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message(f"\nSource: {DATASET}, read live. BART's `delay` is a signed number of seconds, "
                    "so a positive value is that many seconds behind, and a train with no estimate "
                    "is on the board but has no time published for it.")
        return STOP_END_TURN

    def _run_skill(self, ctx: SessionContext, params: dict, tool: str) -> str:
        """The premium skill. The licence is checked on the gateway, not here."""
        data, refused = premium_call(self.gateway, "bayarea_deadline_plan", {
            "station": params["abbr"],
            "minutes": int(params["minutes"]),
        }, {"agent": "bayarea"})
        if refused:
            # Already an (answer, artifact) pair, worded by the gateway.
            answer, artifact = refused
            ctx.tool_call_update(tool, status="completed",
                                 content=ctx.text_content(artifact["summary"]))
            ctx.stream_text(answer + "\n")
            ctx.message("That is a premium skill, so the answer comes from the licence gateway. "
                        "The wording above is the gateway's own.")
            return STOP_END_TURN

        if not isinstance(data, dict) or not data.get("station"):
            answer, artifact = empty_premium_answer(
                "The licence gateway did not send back a plan for that station.",
                {"agent": "bayarea"})
            ctx.tool_call_update(tool, status="completed",
                                 content=ctx.text_content(artifact["summary"]))
            ctx.stream_text(answer + "\n")
            ctx.message("I could not read a plan out of what the gateway sent.")
            return STOP_END_TURN

        body = render_plan(data)
        catch = data.get("last_catchable") or {}
        summary = (f"{data['station']}: last catchable train "
                   f"{_in_words(catch.get('minutes'))} to {catch.get('destination', 'not reported')}")
        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message("\nSource: BART's live departure board, worked out on the licence gateway. The "
                    "board only ever shows the next few trains, so this plan is only as good as the "
                    "end of that list: a train that is not on the board yet is not counted, and "
                    "nothing here is a promise about the line further along.")
        return STOP_END_TURN

    def on_cancel(self, session) -> None:
        return None  # one read, one answer


def main(argv=None) -> int:
    import logging

    logging.basicConfig(level=logging.INFO, stream=sys.stderr,
                        format="%(asctime)s %(levelname)s %(name)s %(message)s")
    try:
        BayAreaAgent().run()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
