"""Satellites - what is in orbit right now, and what orbit it is in.

Celestrak publishes every tracked satellite's two-line elements, keyless, and nobody
asks them from an editor. "what satellites are overhead?" lists the station group with
the inclination, the period and the age of each element set, and "tell me about the
ISS" reads one element set. The orbital altitude and the shells the stations fall into
are a separate question, and they are the premium skill.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from acp_kit import STOP_END_TURN, STOP_REFUSAL, AcpAgent, SessionContext, prompt_text

from data import (DATASET, SatelliteData, SatelliteError,  # noqa: E402
                  SatelliteNotFound, canonical_group, object_id_from_text)

HELP = (
    "I read Celestrak's two-line orbital elements (keyless, updated daily). Ask me:\n"
    "  - what satellites are overhead?\n"
    "  - tell me about the ISS\n"
    "  - cat id 25544\n"
    "  - 1998-067A\n"
    "  - give me the TLE for cat id 25544\n"
    "Every element set carries the epoch it was measured at, and I always say how old\n"
    "that is: an element set from last week no longer describes where a satellite is.\n"
    "Mean motion is revolutions a day, not radians a second, so the period and the\n"
    "altitude are worked out from it rather than read off.\n"
    "One thing I do not do: predict a pass. 'When does the ISS next pass?' needs an SGP4\n"
    "orbit propagator plus your location, and I will not invent a time. The orbital\n"
    "altitude and the shells the stations share are a premium skill."
)

PERMISSION_KEY = "satellites-read-celestrak-elements"

SKILLS = ("satellites-stations", "satellites-lookup", "satellites-name",
          "satellites-tle", "satellites-orbit-shell", "help")

_SAT_WORDS = re.compile(r"\b(satellite|satellites|sat|spacecraft|station|stations|"
                        r"orbit|orbital|orbital shell|shell|leo|geo|geostationary|"
                        r"iss|tle|two[- ]line|elements?|ephemeris|norad|cat id|"
                        r"catalog id|catalogue number|overhead|up there|in orbit)\b",
                        re.IGNORECASE)
_STATION_WORDS = re.compile(r"\b(what|which|list|show|name|overhead|group|all|every|"
                            r"up there)\b", re.IGNORECASE)
_TLE_WORDS = re.compile(r"\b(tle|two[- ]line element|two[- ]line set|raw element|"
                        r"element set|line of element|lines of element)\b", re.IGNORECASE)
_NAME_WORDS = re.compile(r"\b(tell me about|what about|who is|details? (?:on|for|about)|"
                         r"look up|all|every|modules?|stack)\b", re.IGNORECASE)
_OTHER_WORDS = re.compile(r"\b(weather|forecast|tide|earthquake|air quality|water table|"
                          r"stock price|crypto|news|rocket launch)\b", re.IGNORECASE)

#: A question about the *derived* orbit rather than the published element set: how
#: high, which shell, how the catalogue clusters. The free lookup prints the element
#: set itself, so a plain "tell me about the ISS" stays with it. Nothing else is
#: premium.
_SHELL_WORDS = re.compile(
    r"\b(shell|shells|altitude|altitude_km|how high|how low|height|cluster|clusters|"
    r"clustered|grouped by orbit|same orbit|share[sd]?|which orbit|what orbit|"
    r"orbital height|orbital altitude|orbital period|ranked by|sorted by|"
    r"breakdown|break down|by orbit)\b",
    re.IGNORECASE,
)

#: The Celestrak groups worth naming. Celestrak's own list is short - stations, visual,
#: science, weather, amateur, cubesat, geo - and asking for anything else returns a plain
#: 'Invalid query' sentence, so the agent maps people's words onto that list.
_GROUP_WORDS = re.compile(
    r"\b(stations|station|visual|weather|science|scientific|amateur|"
    r"cube[- ]?sats?|cubesat|geostationary|geo)\b",
    re.IGNORECASE,
)


def sat_query_from_text(text: str) -> str:
    """The satellite name or id in the question, with the request words taken out.

    'tell me about the ISS' asks about 'ISS'; 'cat id 25544' asks about '25544'.
    """
    working = str(text or "").strip()
    working = re.sub(
        r"^\s*(?:please\s+)?(?:can you\s+)?(?:show|find|get|give|list|tell me about|"
        r"what(?:'s| is| are)?|who is|look up|pull up|details? (?:on|for|about)|"
        r"i want|i need)\b[\s:]*", "", working, flags=re.IGNORECASE)
    working = re.sub(r"\b(?:the|a|an|me|for|of|about|with|and|please|thanks|thank you)\b",
                     " ", working, flags=re.IGNORECASE)
    return re.sub(r"\s+", " ", working).strip()


def route(text: str) -> tuple[str, dict]:
    """Deterministic intent routing: (skill, params). Pure function, easy to test."""
    stripped = str(text or "").strip()
    if not stripped or re.search(r"\b(help|what can you do|commands?)\b", stripped, re.IGNORECASE):
        return "help", {}
    if _OTHER_WORDS.search(stripped) and not _SAT_WORDS.search(stripped):
        return "help", {}

    object_id = object_id_from_text(stripped)
    remainder = sat_query_from_text(stripped)

    # Checked first, and narrow on purpose: the derived orbit, not the element set.
    # A plain lookup, a TLE request and a station list all fall through below.
    if _SHELL_WORDS.search(stripped) and _SAT_WORDS.search(stripped):
        params: dict = {}
        if object_id:
            params["object_id"] = object_id
        group = _GROUP_WORDS.search(stripped)
        if group:
            params["group"] = canonical_group(group.group(1))
        return "satellites-orbit-shell", params

    if _TLE_WORDS.search(stripped):
        if not object_id:
            return "help", {}
        return "satellites-tle", {"object_id": object_id}

    if object_id:
        return "satellites-lookup", {"object_id": object_id}

    if remainder and _SAT_WORDS.search(stripped) and (_NAME_WORDS.search(stripped)
                                                      or re.match(r"^\S+\s*$", remainder)):
        return "satellites-name", {"query": remainder}

    if _SAT_WORDS.search(stripped) and _STATION_WORDS.search(stripped):
        return "satellites-stations", {"group": "stations"}
    if _SAT_WORDS.search(stripped):
        return "satellites-stations", {"group": "stations"}
    return "help", {}


def _num(value, digits: int = 3) -> str:
    """A number for a line of text, or the honest 'not reported'.

    Trailing zeros are dropped only after a decimal point, so 90.0 prints as 90 and
    not as 9.
    """
    if value is None or value == "":
        return "not reported"
    try:
        text = f"{float(value):.{digits}f}"
    except (TypeError, ValueError):
        return str(value)
    if "." in text:
        text = text.rstrip("0").rstrip(".")
    return text or "0"


def _age(hours) -> str:
    """An element set's age in words, because '7.4 hours' is easier to judge than an ISO date."""
    if hours is None:
        return "epoch not reported"
    value = float(hours)
    if value < 0:
        return f"epoch is {-value:.1f} h in the future, which means the feed's clock is off"
    if value < 48:
        return f"{value:.1f} h old"
    return f"{value / 24:.1f} days old"


def render_row(row: dict) -> str:
    """One satellite: its element set, in the units the feed actually uses."""
    lines = [f"{row['name']}  [cat {row['cat_id']}]"]
    if row.get("international_designator"):
        lines.append(f"  designator: {row['international_designator']} | "
                     f"epoch {row.get('epoch') or 'not reported'} ({_age(row.get('epoch_age_hours'))})")
    lines.append(f"  inclination: {_num(row.get('inclination'), 4)} deg | "
                 f"eccentricity: {_num(row.get('eccentricity'), 7)} | "
                 f"mean motion: {_num(row.get('mean_motion'), 5)} rev/day")
    lines.append(f"  period: {_num(row.get('period_minutes'), 2)} min | "
                 f"raan: {_num(row.get('ra_of_asc_node'), 4)} deg | "
                 f"arg of perigee: {_num(row.get('arg_of_pericenter'), 4)} deg | "
                 f"mean anomaly: {_num(row.get('mean_anomaly'), 4)} deg")
    lines.append(f"  drag term bstar: {_num(row.get('bstar'), 9)} | "
                 f"mean motion dot: {_num(row.get('mean_motion_dot'), 9)} | "
                 f"mean motion ddot: {_num(row.get('mean_motion_ddot'), 6)}")
    return "\n".join(lines)


def render_stations(overview: dict) -> str:
    """The station group: how many, how fresh, and then the list."""
    lines = [f"Celestrak's {overview['group']!r} group: {overview['count']} tracked object(s)"]
    if overview.get("newest_hours") is not None:
        lines.append(f"  element sets run from {_age(overview['newest_hours'])} to "
                     f"{_age(overview['oldest_hours'])}")
    for row in overview["rows"]:
        lines.append(f"  {row['name']}  [cat {row['cat_id']}]  "
                     f"incl {_num(row.get('inclination'), 3)} deg, "
                     f"period {_num(row.get('period_minutes'), 1)} min, "
                     f"element set {_age(row.get('epoch_age_hours'))}")
    return "\n".join(lines)


def render_name(found: dict) -> str:
    """Every element set a name search matched, which for a station is its whole stack."""
    lines = [f"Celestrak holds {found['count']} element set(s) matching {found['query']!r}"]
    for row in found["rows"]:
        lines.append(f"  {row['name']}  [cat {row['cat_id']}]  "
                     f"incl {_num(row.get('inclination'), 3)} deg, "
                     f"period {_num(row.get('period_minutes'), 1)} min, "
                     f"element set {_age(row.get('epoch_age_hours'))}")
    return "\n".join(lines)


def render_tle(data: dict) -> str:
    """The raw two lines, exactly as Celestrak publishes them."""
    lines = [f"Two-line element set for cat {data['object_id']}:"]
    lines.extend(f"  {line}" for line in data["lines"])
    return "\n".join(lines)


def render_shell(data: dict) -> str:
    """The orbit board: altitude, period and which satellites share a shell."""
    lines = [f"Orbital geometry from the two-line elements "
             f"({data.get('group', 'stations')} group)"]
    lines.append(f"  element sets read: {_num(data.get('objects_read'))} of "
                 f"{_num(data.get('objects_in_group'))} in the group, "
                 f"newest {_num(data.get('newest_hours'), 1)} h old, "
                 f"oldest {_num(data.get('oldest_hours'), 1)} h old")
    shells = data.get("shells") or []
    if not shells:
        lines.append("  no satellite in this group has a usable mean motion")
    for shell in shells:
        lines.append(f"  shell at {_num(shell.get('altitude_km'), 1)} km, "
                     f"period {_num(shell.get('period_minutes'), 2)} min: "
                     f"{_num(shell.get('count'))} object(s)")
        for member in (shell.get("members") or [])[:6]:
            lines.append(f"      {member.get('name')}  [cat {member.get('cat_id')}]  "
                         f"incl {_num(member.get('inclination'), 3)} deg, "
                         f"altitude {_num(member.get('altitude_km'), 1)} km")
        if len(shell.get("members") or []) > 6:
            lines.append(f"      ... and {_num(len(shell['members']) - 6)} more in this shell")
    leader = data.get("shell_leader")
    if isinstance(leader, dict):
        lines.append(f"  the ISS shell is {_num(leader.get('altitude_km'), 1)} km at "
                     f"{_num(leader.get('period_minutes'), 2)} min; "
                     f"{_num(leader.get('share_count'))} of the group sit within "
                     f"{_num(leader.get('within_km'), 1)} km of it")
    else:
        lines.append("  the ISS is not in this group, so there is no ISS shell to compare against")
    lines.append(f"  inclination spread: {_num(data.get('inclination_min'), 3)} to "
                 f"{_num(data.get('inclination_max'), 3)} deg")
    return "\n".join(lines)


class SatellitesAgent(AcpAgent):
    name = "satellites"
    title = "Satellites - what is in orbit, and what orbit it is in"
    version = "1.0.0"

    def __init__(self, connection=None, data: SatelliteData | None = None,
                 gateway=None) -> None:
        super().__init__(connection)
        self.data = data or SatelliteData()
        self.gateway = gateway

    # -- ACP ---------------------------------------------------------------

    def new_session(self, session) -> dict:
        session.remember("agent", "Satellites session opened. " + HELP.splitlines()[0])
        return {}

    def prompt(self, ctx: SessionContext, prompt: list[dict]) -> str:
        text = prompt_text(prompt)
        skill, params = route(text)
        ctx.plan([
            (f"Route the request ({skill})", "high"),
            ("Read Celestrak's two-line elements", "medium"),
            ("Report the satellites, the elements and the epoch ages", "medium"),
        ])

        if skill == "help":
            ctx.stream_text(HELP)
            ctx.message("Element sets are free and keyless. Altitude and shells are premium.")
            return STOP_END_TURN

        tool = f"call_{skill.replace('-', '_')}"
        ctx.tool_call(tool, "Read Celestrak's two-line elements", kind="fetch", name=skill,
                      raw_input=dict(params))
        if not ctx.ask_permission(tool, "Allow Satellites to read Celestrak's public elements?",
                                  remember_key=PERMISSION_KEY):
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content("permission denied"))
            ctx.message("I need permission to read Celestrak's elements first.")
            return STOP_REFUSAL
        ctx.tool_call_update(tool, status="in_progress")

        try:
            if skill == "satellites-orbit-shell":
                return self._run_skill(ctx, params, tool)
            if skill == "satellites-tle":
                data = self.data.tle(params["object_id"])
                body = render_tle(data)
                summary = f"cat {data['object_id']}: {len(data['lines'])} line(s)"
            elif skill == "satellites-lookup":
                row = self.data.lookup(params["object_id"])
                body = render_row(row)
                summary = f"{row['name']} [cat {row['cat_id']}]: period {row.get('period_minutes'):.1f} min"
            elif skill == "satellites-name":
                found = self.data.by_name(params["query"])
                body = render_name(found)
                summary = f"{found['query']}: {found['count']} element set(s)"
            else:
                overview = self.data.stations(params.get("group") or "stations")
                body = render_stations(overview)
                summary = f"{overview['group']}: {overview['count']} tracked object(s)"
        except (SatelliteError, ValueError) as exc:
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content(str(exc)))
            ctx.message(f"I could not read Celestrak's elements: {exc}")
            return STOP_END_TURN

        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message(f"\nSource: {DATASET}, read live. Mean motion is revolutions a day, and the "
                    "period and altitude here are worked out from it. An element set is only as "
                    "good as its epoch: the ISS's own set is republished several times a day, "
                    "while a dead object's last set can be years old.")
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
        SatellitesAgent().run()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
