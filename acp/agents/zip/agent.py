"""ZIP code - what is in a postal code, and how far one is from another.

Zippopotam publishes a postal code directory in 30 countries, keyless. Nobody asks it
from an editor. "what places are in ZIP 11235?" gets the place and its coordinates;
"how far is 11235 from 10001, which way, and how long is that?" is the question one
postal code record cannot answer, and that one goes to the licence gateway.

One thing this agent will not do: answer "what is the ZIP for Aspen". The directory is
keyed by postal code and has no search endpoint, so a reverse lookup would mean guessing
codes, and a wrong ZIP is worse than no answer. That limit is stated in the help text
rather than papered over.
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

from data import (COUNTRIES, DATASET, NO_COVERAGE, ZipData, ZipError,  # noqa: E402
                  ZipNotFound, country_code_from_text, normalise, postal_code_from_text)

HELP = (
    "I read the Zippopotam postal code directory (keyless, 30 countries). Ask me:\n"
    "  - what places are in ZIP 11235?\n"
    "  - where is 100-0001 in Japan?\n"
    "  - which countries does this directory cover?\n"
    "How far is ZIP 11235 from ZIP 10001, which way, and how long is that? (premium - one code's "
    "record cannot answer it)\n"
    "Tell me the country as well as the code whenever you can: 1012 is an Amsterdam postcode and "
    "101 is an Icelandic one, and a postal code on its own is not a lookup key here.\n"
    "What I will NOT do is the reverse: this directory is keyed by postal code and has no search, "
    "so \"what is the ZIP for Aspen\" is not something I can answer without guessing codes. The "
    "United Kingdom, Canada, Ireland, Singapore and Cyprus are not in the directory at all."
)

PERMISSION_KEY = "zip-read-zippopotam"

SKILLS = ("zip-places", "zip-where", "zip-countries", "zip-reach", "help")

#: How far one postal code is from another: two codes and a word that says the
#: question is about the distance between them rather than about either one.
_REACH_WORDS = re.compile(
    r"\b(how far|how close|distance|reach|reach out|apart|from|to|and)\b", re.IGNORECASE)

#: Words that mean "tell me what this code holds". They block the two-code
#: question, because "what places are in 11235 and 10001" is a contents question
#: with two codes in it, not a distance between them.
_CONTENTS_WORDS = re.compile(
    r"\b(places?|cities|city|towns?|villages?|cover(s|ed|ing)?|contain(s|ed|ing)?|"
    r"list|every|all|who lives|neighbou?rs?)\b", re.IGNORECASE)

#: A single code and a contents word is the places question. Everything else with
#: one code is the record question.
_PLACES_Q = re.compile(
    r"\b(places?|cities|city|towns?|villages?|cover(s|ed|ing)?|contain(s|ed|ing)?|who)\b",
    re.IGNORECASE)

_COUNTRY_LIST_WORDS = re.compile(
    r"\b(which|what|list|name|show|every|all)\b[^.?]{0,24}\b(countries|country|nations?|"
    r"coverage|cover)\b|\bcountries (?:does|do|is|are)\b", re.IGNORECASE)


def route(text: str) -> tuple[str, dict]:
    """Deterministic intent routing: (skill, params). Pure function, easy to test."""
    stripped = str(text or "").strip()
    if not stripped or re.search(r"\b(help|what can you do|commands?)\b", stripped, re.IGNORECASE):
        return "help", {}

    if _COUNTRY_LIST_WORDS.search(stripped) and not postal_code_from_text(stripped):
        return "zip-countries", {}

    codes = _codes_in_order(stripped)
    country = country_code_from_text(stripped)
    if len(codes) >= 2 and _REACH_WORDS.search(stripped) and not _CONTENTS_WORDS.search(stripped):
        return "zip-reach", {"from": codes[0], "to": codes[1],
                             "country": country or "us"}
    if len(codes) >= 1:
        params = {"code": codes[0], "country": country or _default_country(codes[0])}
        if _PLACES_Q.search(stripped):
            return "zip-places", params
        return "zip-where", params
    return "help", {}


def _codes_in_order(text: str) -> list[str]:
    """Every postal-code-shaped token in the question, in the order written."""
    found: list[str] = []
    for match in re.finditer(r"(?<![\w-])([A-Za-z]{0,2}\d[A-Za-z0-9]*(?:-[A-Za-z0-9]{2,4})?)"
                             r"(?![\w-])", str(text or "")):
        candidate = normalise(match.group(1))
        if len(candidate) >= 3 and any(character.isdigit() for character in candidate):
            if candidate not in found:
                found.append(candidate)
    return found


def _default_country(code: str) -> str:
    """The one country this code exists in, when only one does.

    A five-digit code with no separator is a US ZIP in this directory, and that is
    the only country here written that way. Every other country's code carries a
    separator or a letter, so the guess is stated rather than hidden: the agent
    says which country it assumed.
    """
    if re.fullmatch(r"\d{5}", code):
        return "us"
    return ""


def _show(value) -> str:
    """A field for a line of text, or 'none published' when there is none."""
    if value is None or value == "":
        return "none published"
    return str(value)


def _num(value) -> str:
    """A number for a line of text, or the honest 'not reported'."""
    if value is None or value == "":
        return "not reported"
    try:
        return f"{float(value):g}"
    except (TypeError, ValueError):
        return str(value)


def _coordinates(place: dict) -> str:
    if place.get("latitude") is None or place.get("longitude") is None:
        return "coordinates not published"
    return f"{place['latitude']:.4f}, {place['longitude']:.4f}"


def render_places(record: dict) -> str:
    """The place list of one postal code."""
    lines = [f"{record['postal_code']}, {record['country']} "
             f"({len(record['places'])} place(s) in the directory):"]
    for place in record["places"]:
        where = ", ".join(bit for bit in (place.get("state"),
                                          place.get("state_abbreviation")) if bit)
        suffix = f", {where}" if where else ""
        lines.append(f"  {place['name']}{suffix} at {_coordinates(place)}")
    lines.append(f"  source: {record['source']}")
    return "\n".join(lines)


def render_where(record: dict) -> str:
    """One postal code's own record."""
    lines = [f"{record['postal_code']} in {record['country']} "
             f"(directory code {record['country_abbreviation']})"]
    first = record["places"][0]
    lines.append(f"  covers {record['count']} place(s) in this directory: "
                 + ", ".join(place["name"] for place in record["places"]))
    if first.get("state"):
        lines.append(f"  region: {_show(first['state'])}"
                     + (f" ({first['state_abbreviation']})"
                        if first.get("state_abbreviation") else ""))
    lines.append(f"  centroid: {_coordinates(first)}")
    lines.append("  a postal code here is one point in the directory, not a boundary: it "
                 "publishes no shape, no population and no list of neighbouring codes, so "
                 "\"what does it border\" is not something this directory can answer.")
    lines.append(f"  source: {record['source']}")
    return "\n".join(lines)


def render_countries() -> str:
    """The directory's coverage."""
    lines = [f"this directory covers {len(COUNTRIES)} countries:"]
    for code, example, name in sorted(COUNTRIES, key=lambda row: row[2]):
        lines.append(f"  {name} ({code}) - example {example}")
    missing = sorted(set(NO_COVERAGE.values()))
    if missing:
        lines.append("  not covered, so I will not answer for them: " + ", ".join(missing))
    return "\n".join(lines)


def render_reach(data: dict, want_miles: bool) -> str:
    """The premium answer: the distance between two postal codes."""
    unit = "miles" if want_miles else "km"
    lines = [f"{data.get('from', '?')} to {data.get('to', '?')}:"]
    lines.append(f"  straight line: {_num(data.get('distance_km'))} km / "
                 f"{_num(data.get('distance_miles'))} mi"
                 + (" (asked in miles)" if want_miles else ""))
    bearing = data.get("bearing") or _num(data.get("bearing_deg"))
    lines.append(f"  direction: {bearing} ({data.get('compass', 'not reported')}) from "
                 f"{data.get('from_place', '?')} to {data.get('to_place', '?')}")
    lines.append(f"  initial bearing is the direction at the start; the great circle bends "
                 f"toward the pole, so it is not the same at the far end")
    lines.append("  if it were a straight line the whole way:")
    lines.append(f"    walking at {_num(data.get('walk_kmh'))} km/h: "
                 f"{_hours(_num(data.get('walk_hours')))}")
    lines.append(f"    driving at {_num(data.get('drive_kmh'))} km/h: "
                 f"{_hours(_num(data.get('drive_hours')))}")
    lines.append("  the two codes:")
    for side in data.get("sides") or []:
        lines.append(f"    {side.get('code')} in {side.get('country')}: {side.get('place')}"
                     + (f", {side.get('state')}" if side.get("state") else "")
                     + f", at {_num(side.get('latitude'))}, {_num(side.get('longitude'))}")
    if data.get("same_country") and data.get("same_country") is True:
        lines.append("  same country, so the distance is a domestic one")
    elif data.get("same_country") is False:
        lines.append("  different countries, so this is an international distance and the "
                     "straight line crosses at least one border")
    lines.append(f"  source: {data.get('source', 'not reported')}")
    return "\n".join(lines)


def _hours(value) -> str:
    """A decimal number of hours as hours and minutes, or 'not reported'."""
    try:
        hours = float(value)
    except (TypeError, ValueError):
        return "not reported"
    whole = int(hours)
    minutes = round((hours - whole) * 60)
    if minutes == 60:
        whole, minutes = whole + 1, 0
    if whole == 0:
        return f"{minutes} min"
    return f"{whole} h {minutes:02d} min" if minutes else f"{whole} h"


class ZipAgent(AcpAgent):
    name = "zip"
    title = "ZIP code - what is in a postal code, and how far one is from another"
    version = "1.0.0"

    def __init__(self, connection=None, data: ZipData | None = None,
                 gateway=None) -> None:
        super().__init__(connection)
        self.data = data or ZipData()
        # The licence check lives on the gateway, not here, so deleting a line
        # from this repository buys nobody the answer.
        self.gateway = gateway or GatewayClient()

    # -- ACP ---------------------------------------------------------------

    def new_session(self, session) -> dict:
        session.remember("agent", "ZIP session opened. " + HELP.splitlines()[0])
        return {}

    def prompt(self, ctx: SessionContext, prompt: list[dict]) -> str:
        text = prompt_text(prompt)
        skill, params = route(text)
        ctx.plan([
            (f"Route the request ({skill})", "high"),
            ("Read the postal code directory", "medium"),
            ("Report the place list or the distance", "medium"),
        ])

        if skill == "help":
            ctx.stream_text(HELP)
            ctx.message("No reverse lookup: the directory has no search, so "
                        "'what is the ZIP for Aspen' is not answerable and I will not guess.")
            return STOP_END_TURN

        tool = f"call_{skill.replace('-', '_')}"
        label = ("Ask the licence gateway for the distance" if skill == "zip-reach"
                 else "Read the postal code directory")
        ctx.tool_call(tool, label, kind="fetch", name=skill, raw_input=dict(params))
        if not ctx.ask_permission(tool, "Allow ZIP to read the postal code directory?",
                                  remember_key=PERMISSION_KEY):
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content("permission denied"))
            ctx.message("I need permission to read the postal code directory first.")
            return STOP_REFUSAL
        ctx.tool_call_update(tool, status="in_progress")

        if skill == "zip-countries":
            body = render_countries()
            summary = f"the directory covers {len(COUNTRIES)} countries"
            ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
            ctx.stream_text(body + "\n")
            ctx.message(f"\nSource: {DATASET}. Every example code in that list was looked up and "
                        "answered by the directory on 2026-09-28, so each row is a format the "
                        "directory really holds rather than one described from outside.")
            return STOP_END_TURN

        try:
            if skill == "zip-reach":
                return self._run_skill(ctx, params, tool, _wants_miles(text))

            country = params.get("country") or ""
            if not country:
                raise ValueError("tell me the country too, because a postal code means nothing "
                                 "without one - 1012 is an Amsterdam postcode and 101 is Icelandic")
            record = self.data.postal_code(country, params["code"])
            if skill == "zip-places":
                body = render_places(record)
                summary = (f"{record['postal_code']}, {record['country']}: "
                           f"{record['places'][0]['name']}")
            else:
                body = render_where(record)
                summary = (f"{record['postal_code']} in {record['country']}: "
                           f"{record['places'][0]['name']}")
        except (ZipError, GatewayError, ValueError) as exc:
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content(str(exc)))
            ctx.message(f"I could not read the postal code directory: {exc}")
            return STOP_END_TURN

        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message(f"\nSource: {DATASET}, read live. This is a delivery area's point in the "
                    "directory, not a boundary: it says where the code is centred and what it is "
                    "named after, and nothing about how big it is or what it touches.")
        return STOP_END_TURN

    def _run_skill(self, ctx: SessionContext, params: dict, tool: str, want_miles: bool) -> str:
        """The premium skill. The licence is checked on the gateway, not here."""
        data, refused = premium_call(self.gateway, "zip_reach", {
            "from": normalise(params["from"]),
            "to": normalise(params["to"]),
            "country": params.get("country") or "us",
        }, {"agent": "zip"})
        if refused:
            # Already an (answer, artifact) pair, worded by the gateway.
            answer, artifact = refused
            ctx.tool_call_update(tool, status="completed",
                                 content=ctx.text_content(artifact["summary"]))
            ctx.stream_text(answer + "\n")
            ctx.message("That is a premium skill, so the answer comes from the licence gateway. "
                        "The wording above is the gateway's own.")
            return STOP_END_TURN

        if not isinstance(data, dict) or not data.get("from"):
            answer, artifact = empty_premium_answer(
                "The licence gateway did not send back a distance for those two codes.",
                {"agent": "zip"})
            ctx.tool_call_update(tool, status="completed",
                                 content=ctx.text_content(artifact["summary"]))
            ctx.stream_text(answer + "\n")
            ctx.message("I could not read a distance out of what the gateway sent.")
            return STOP_END_TURN

        body = render_reach(data, want_miles)
        summary = (f"{data['from']} to {data['to']}: {_num(data.get('distance_km'))} km, "
                   f"{data.get('compass', 'not reported')}")
        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message("\nSource: the postal code directory, measured on the licence gateway. Every "
                    "figure is a straight line between the two codes' published points, and the "
                    "walk and drive times assume the distance is a road: neither is a route, and a "
                    "real journey across water or a mountain range is longer than the number "
                    "above.")
        return STOP_END_TURN

    def on_cancel(self, session) -> None:
        return None  # one read, one answer


def _wants_miles(text: str) -> bool:
    """Whether the question asked in miles, so the answer leads with that unit."""
    return bool(re.search(r"\bmiles?\b|\bmi\b", str(text or ""), re.IGNORECASE))


def main(argv=None) -> int:
    import logging

    logging.basicConfig(level=logging.INFO, stream=sys.stderr,
                        format="%(asctime)s %(levelname)s %(name)s %(message)s")
    try:
        ZipAgent().run()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
