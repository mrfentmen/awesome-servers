"""F1 - when the next race is, who won the last one, and who the standings say.

Jolpica publishes the whole Formula 1 calendar, every result, both championship tables and
every driver's record, keyless, and nobody asks it from an editor. "when is the next race?"
gets the race and every session of its weekend. "who won last week?" gets the finishing order
with the times. Where the title goes from here is a separate skill.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from acp_kit import STOP_END_TURN, STOP_REFUSAL, AcpAgent, SessionContext, prompt_text

from data import (DATASET, F1Data, F1Error, F1NotFound,  # noqa: E402
                  _season, driver_from_text)

HELP = (
    "I read the Jolpica/Ergast Formula 1 feed (keyless) - the calendar, results, both\n"
    "championship tables and every driver's record. Ask me:\n"
    "  - when is the next F1 race?\n"
    "  - who won the last race?\n"
    "  - what are the driver standings?\n"
    "  - who are the constructor standings?\n"
    "  - tell me about max_verstappen\n"
    "Times are UTC where the feed publishes UTC. A driver who did not finish has no race time\n"
    "in the feed at all, so it is reported as did not finish rather than invented.\n"
    "Projecting where the championship lands is a separate skill."
)

PERMISSION_KEY = "f1-read-jolpica-ergast"

SKILLS = ("f1-next", "f1-last", "f1-standings", "f1-constructors", "f1-driver", "f1-projection",
          "help")

_NEXT_WORDS = re.compile(
    r"\b(next|upcoming|when is|when does|next race|coming up|calendar|schedule|this weekend|"
    r"what'?s on)\b",
    re.IGNORECASE,
)
_LAST_WORDS = re.compile(
    r"\b(last|previous|just finished|yesterday|who won|winner|results?|podium|finished|"
    r"last race)\b",
    re.IGNORECASE,
)
_CONSTRUCTOR_WORDS = re.compile(
    r"\b(constructor|constructors|team|teams|outfit|constructor'?s)\b", re.IGNORECASE,
)
_STANDINGS_WORDS = re.compile(
    r"\b(standings|championship|table|points|who'?s leading|leader|positions?)\b",
    re.IGNORECASE,
)
_OTHER_WORDS = re.compile(
    r"\b(weather|recipe|episode|comic|xkcd|song|album|water table|package version)\b",
    re.IGNORECASE,
)
#: The premium question, and the only one. The free skills print the table as it stands; this
#: projects the season from the points-per-race rate, which is arithmetic, not a lookup. It
#: needs the projection words, so "what are the standings" stays free.
_PROJECTION_WORDS = re.compile(
    r"\b(project|projection|projected|projections|projecting|who wins|who will win|"
    r"win the (?:title|world ?championship)|title (?:race|battle|fight)|"
    r"end of the season|at the end of|by the end|if the season|finish(?:es)? (?:on|with)|"
    r"where will (?:they|the points|it) end|chances? of)\b",
    re.IGNORECASE,
)


def route(text: str) -> tuple[str, dict]:
    """Deterministic intent routing: (skill, params). Pure function, easy to test."""
    stripped = str(text or "").strip()
    if not stripped or re.search(r"\b(help|what can you do|commands?)\b", stripped, re.IGNORECASE):
        return "help", {}
    if _OTHER_WORDS.search(stripped):
        return "help", {}
    # Checked before the free routes, and narrow on purpose: a projection question. "who is
    # leading" carries none of these words and stays with the free standings skill.
    if _PROJECTION_WORDS.search(stripped):
        params: dict = {"season": _season(stripped)}
        if re.search(r"\b\d{1,2}\s+(?:races?\s+)?left\b", stripped, re.IGNORECASE):
            pass
        return "f1-projection", params
    if _CONSTRUCTOR_WORDS.search(stripped) and _STANDINGS_WORDS.search(stripped):
        return "f1-constructors", {"season": _season(stripped)}
    driver = driver_from_text(stripped)
    if driver and not _STANDINGS_WORDS.search(stripped) and not _NEXT_WORDS.search(stripped) \
            and not _LAST_WORDS.search(stripped):
        return "f1-driver", {"driver_id": driver}
    if _NEXT_WORDS.search(stripped):
        return "f1-next", {"season": _season(stripped)}
    if _LAST_WORDS.search(stripped):
        return "f1-last", {"season": _season(stripped)}
    if _STANDINGS_WORDS.search(stripped):
        return "f1-standings", {"season": _season(stripped)}
    return "help", {}


def render_race(race: dict) -> str:
    """One race: where and when, and every session of its weekend."""
    lines = [f"{race['name']} - round {race['round']} of the {race['season']} season"]
    lines.append(f"  date: {race['date']} ({race['time']})")
    lines.append(f"  circuit: {race['circuit']}, {race['place']}")
    for label, when in (race.get("sessions") or {}).items():
        lines.append(f"  {label}: {when}")
    if not race.get("sessions"):
        lines.append("  no session times published for this race")
    if race.get("url"):
        lines.append(f"  {race['url']}")
    return "\n".join(lines)


def render_last(race: dict) -> str:
    """The last race that ran, and its finishing order."""
    lines = [f"{race['name']} - round {race['round']} of the {race['season']} season"]
    lines.append(f"  raced: {race['date']} at {race['circuit']}")
    for row in race.get("results") or []:
        bits = []
        if row.get("constructor"):
            bits.append(row["constructor"])
        if row.get("points"):
            bits.append(f"{row['points']} point(s)")
        if row.get("laps"):
            bits.append(f"{row['laps']} lap(s)")
        if row.get("grid"):
            bits.append(f"from grid {row['grid']}")
        if row.get("fastest_lap"):
            bits.append(f"fastest {row['fastest_lap']}")
        lines.append(f"  P{row['position']} {row['driver']} - "
                     + (", ".join(bits) if bits else "no detail published")
                     + f" ({row['time']})")
    if race.get("url"):
        lines.append(f"  {race['url']}")
    return "\n".join(lines)


def render_standings(table: dict, label: str) -> str:
    """A championship table, as the feed has it."""
    lines = [f"{label} after round {table['round']} of {table['season']}:"]
    for row in table.get("rows") or []:
        if "driver" in row:
            bits = []
            if row.get("constructor"):
                bits.append(row["constructor"])
            if row.get("wins"):
                bits.append(f"{row['wins']} win(s)")
            lines.append(f"  P{row['position']} {row['driver']}"
                         + (f" - {', '.join(bits)}" if bits else "")
                         + f" ({row['points']} point(s))")
        else:
            lines.append(f"  P{row['position']} {row['constructor']} - "
                         f"{row.get('wins', 'not reported')} win(s) ({row['points']} point(s))")
    return "\n".join(lines)


def render_driver(driver: dict) -> str:
    """One driver's own record."""
    lines = [f"{driver['name']}"]
    bits = []
    if driver.get("number"):
        bits.append(f"number {driver['number']}")
    if driver.get("code"):
        bits.append(f"code {driver['code']}")
    if driver.get("nationality"):
        bits.append(driver["nationality"])
    if bits:
        lines.append("  " + ", ".join(bits))
    lines.append(f"  born: {driver['born']}")
    lines.append(f"  feed key: {driver.get('key') or driver.get('driver_id') or 'not published'}")
    if driver.get("url"):
        lines.append(f"  {driver['url']}")
    return "\n".join(lines)


def _num(value) -> str:
    """A number for a line of text, or the honest 'not reported'."""
    if value is None or value == "":
        return "not reported"
    try:
        return f"{float(value):g}"
    except (TypeError, ValueError):
        return str(value)


def render_projection(data: dict) -> str:
    """Where the championship lands, and on what arithmetic."""
    lines = [f"{data.get('season', 'not reported')} championship projection "
             f"after round {data.get('afterRound', 'not reported')}"]
    lines.append(f"  races remaining: {data.get('racesRemaining', 'not reported')}")
    lines.append(f"  leader: {data.get('leader', 'not reported')} on "
                 f"{_num(data.get('leaderPoints'))} point(s)")
    lines.append(f"  projected champion: {data.get('projectedChampion', 'not reported')}"
                 + (f", by {_num(data.get('projectedMargin'))} point(s)"
                    if data.get("projectedMargin") is not None else ""))
    lines.append("")
    for row in data.get("drivers") or []:
        lines.append(f"  P{_num(row.get('position'))} {row.get('driver', 'not reported')}"
                     f" - {row.get('constructor') or 'constructor not reported'}: "
                     f"{_num(row.get('points'))} now, "
                     f"{_num(row.get('pointsPerRace'))} a race, "
                     f"{_num(row.get('projectedPoints'))} projected, "
                     f"{_num(row.get('gapToLeader'))} behind the leader")
    lines.append("")
    lines.append(f"  method: {data.get('method', 'not reported')}")
    lines.append(f"  source: {data.get('source', 'not reported')}")
    return "\n".join(lines)


class F1Agent(AcpAgent):
    name = "f1"
    title = "F1 - the next race, the last result, the standings, and where the title goes"
    version = "1.0.0"

    def __init__(self, connection=None, data: F1Data | None = None, gateway=None) -> None:
        super().__init__(connection)
        self.data = data or F1Data()
        self.gateway = gateway

    # -- ACP ---------------------------------------------------------------

    def new_session(self, session) -> dict:
        session.remember("agent", "F1 session opened. " + HELP.splitlines()[0])
        return {}

    def prompt(self, ctx: SessionContext, prompt: list[dict]) -> str:
        text = prompt_text(prompt)
        skill, params = route(text)
        ctx.plan([
            (f"Route the request ({skill})", "high"),
            ("Read the Jolpica/Ergast F1 feed", "medium"),
            ("Report the date, the order and the points", "medium"),
        ])

        if skill == "help":
            ctx.stream_text(HELP)
            ctx.message("A driver who did not finish has no race time in the feed at all.")
            return STOP_END_TURN

        tool = f"call_{skill.replace('-', '_')}"
        ctx.tool_call(tool, "Read the Jolpica/Ergast F1 feed", kind="fetch", name=skill,
                      raw_input=dict(params))
        if not ctx.ask_permission(tool, "Allow F1 to read the public Jolpica/Ergast feed?",
                                  remember_key=PERMISSION_KEY):
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content("permission denied"))
            ctx.message("I need permission to read the F1 feed first.")
            return STOP_REFUSAL
        ctx.tool_call_update(tool, status="in_progress")

        try:
            if skill == "f1-projection":
                return self._run_skill(ctx, params, tool)
            if skill == "f1-next":
                coming = self.data.next_race(params["season"])
                if not coming["races"]:
                    body = (f"No next race: {coming['message']} for {coming['season']}. "
                            "The season's races are all in the past.")
                    summary = f"no next race for {coming['season']}"
                else:
                    body = render_race(coming["races"][0])
                    summary = f"next: {coming['races'][0]['name']} on {coming['races'][0]['date']}"
            elif skill == "f1-last":
                race = self.data.last_result(params["season"], limit=10)
                body = render_last(race)
                summary = f"{race['name']}: winner {race['results'][0]['driver']}"
            elif skill == "f1-standings":
                table = self.data.driver_standings(params["season"], limit=15)
                body = render_standings(table, "Drivers' championship")
                summary = (f"drivers after round {table['round']}: "
                           f"{table['rows'][0]['driver']} leads")
            elif skill == "f1-constructors":
                table = self.data.constructor_standings(params["season"], limit=10)
                body = render_standings(table, "Constructors' championship")
                summary = (f"constructors after round {table['round']}: "
                           f"{table['rows'][0]['constructor']} leads")
            else:
                driver = self.data.driver(params["driver_id"])
                body = render_driver(driver)
                summary = f"{driver['name']} ({driver.get('nationality') or 'not reported'})"
        except (F1Error, ValueError) as exc:
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content(str(exc)))
            ctx.message(f"I could not read the F1 feed: {exc}")
            return STOP_END_TURN

        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message(f"\nSource: {DATASET}, read live. The feed is the XML-derived MRData shape, "
                    "so a result with no time is a car that did not finish, not a missing "
                    "field.")
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
        F1Agent().run()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
