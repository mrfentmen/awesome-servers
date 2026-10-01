"""The BART agent: four free skills over BART's public API, one behind the gate.

  - departures: the live departure board at a station, train by train
  - lines:      the destinations and directions a station serves, read off that board
  - stations:   the BART station directory, by name, city or abbreviation
  - delays:     the cancelled, limited and live-estimated trains on a board
  - last-departure: given when you can leave, which trains you can still catch (premium)

Fare note: BART's `cmd=fare` answers HTTP 500 from its own server, so there is no
fare skill here rather than a guessed one. Every answer quotes the board as BART
published it, in BART's own clock.

The premium skill sends the request to the licence gateway, which reads the same
board behind the gate and works out the catchability, so an unlicensed caller gets
the gateway's wording and no answer.
"""

from __future__ import annotations

import re

from a2a_kit import GatewayClient, SkillAgent, empty_premium_answer, premium_call

from data import (
    DATASET,
    DEMO_KEY,
    DIRECTORY_TTL,
    LIVE_TTL,
    MAX_DEPARTURES,
    MAX_STATIONS,
    PRODUCT,
    SOURCE,
    STATION_FIELDS,
    BartClient,
    UpstreamError,
)

SKILL_DEPARTURES = "departures"
SKILL_LINES = "lines"
SKILL_STATIONS = "stations"
SKILL_DELAYS = "delays"
SKILL_LAST_DEPARTURE = "last-departure"

MAX_LISTED = 12
MAX_STATION_LIST = 10

CARD_SKILLS = [
    {
        "id": SKILL_DEPARTURES,
        "name": "Live departures",
        "description": (
            "The real-time departure board at a BART station: every train BART is currently estimating, "
            "with its destination, minutes away, platform, direction and line colour, in BART's own "
            "clock. Give a station abbreviation such as EMBR, or a name such as Embarcadero."
        ),
        "tags": ["bart", "transit", "departures", "real-time", "bay-area"],
        "examples": [
            "when is the next train from Embarcadero?",
            "departures at PITT",
            '{"skill": "departures", "station": "EMBR", "direction": "Antioch"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_LINES,
        "name": "What this station serves",
        "description": (
            "The destinations and directions a BART station serves, read off that station's live board: "
            "each destination, its abbreviation, the platforms it uses, how many trains BART is "
            "estimating, and whether any of them are limited."
        ),
        "tags": ["bart", "transit", "lines", "destinations", "network"],
        "examples": [
            "what lines does Embarcadero serve?",
            "which directions go from EMBR?",
            '{"skill": "lines", "station": "EMBR"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_STATIONS,
        "name": "Find BART stations",
        "description": (
            "The BART station directory — 50 stations — by name, by city, or by three or four letter "
            "abbreviation. An ambiguous name is offered back as a choice rather than guessed at."
        ),
        "tags": ["bart", "transit", "stations", "search", "directory"],
        "examples": [
            "which bart station is in Berkeley?",
            "find the station called Pittsburg Center",
            '{"skill": "stations", "name": "MacArthur", "limit": 5}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_DELAYS,
        "name": "Cancellations and limited trains",
        "description": (
            "The disruption view of a BART board: which trains are cancelled, which are running a "
            "limited stop pattern, and which are only live estimates rather than scheduled times — "
            "with BART's own flags, not a judgement."
        ),
        "tags": ["bart", "transit", "delays", "cancellations", "disruptions"],
        "examples": [
            "any cancelled trains at Embarcadero?",
            "is anything running limited at PITT?",
            '{"skill": "delays", "station": "EMBR"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_LAST_DEPARTURE,
        "name": "What can I still catch?",
        "description": (
            "The catchability answer: given the earliest you can leave, every train on the board from "
            "that moment on, the last one you can still catch, and how many trains that leaves you — "
            "with that train's platform, direction, line colour and limited or cancelled flag. Premium: "
            "it runs behind a licence check."
        ),
        "tags": ["bart", "transit", "last-train", "catchable", "planning", "premium"],
        "examples": [
            "if I leave the office in 20 minutes can I still get to Antioch from Embarcadero?",
            "what is the last train from EMBR toward SFO?",
            '{"skill": "last-departure", "station": "EMBR", "direction": "Antioch", "not_before_minutes": 20}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
]

_ABBR_RE = re.compile(r"\b([A-Z0-9]{3,4})\b")
#: A capitalised name phrase: "Embarcadero", "Pittsburg Center", "12th St. Oakland City Center".
_NAME_PHRASE = r"([A-Z][A-Za-z0-9.'’\-]*(?:\s+(?:[A-Z][A-Za-z0-9.'’\-]*|of|the)){0,3})"
_AFTER_PREPOSITION_RE = re.compile(
    rf"\b(?:from|at|near|in|to|leaving|leaves|does|do)\s+(?:the\s+)?{_NAME_PHRASE}"
)
_CALLED_RE = re.compile(rf"\b(?:called|named)\s+{_NAME_PHRASE}")
_DESTINATION_WORDS = re.compile(
    r"\b(?:toward[s]?|to|for|direction|bound|heading|going to|destined for|get to|take)\s+"
    r"([A-Za-z][A-Za-z0-9/.'’\-]{2,40}(?:\s+[A-Za-z][A-Za-z0-9/.'’\-]+){0,3})",
    re.IGNORECASE,
)
#: A destination mention ends at the first preposition or a station abbreviation, so
#: "get to Antioch from EMBR" reads as "Antioch" and not as the rest of the sentence.
_DESTINATION_STOP = {"from", "at", "in", "on", "if", "and", "or", "to", "with", "by", "is", "are",
                     "i", "we", "the", "a", "an", "my", "me", "this", "that", "can", "when"}
_NOT_STATION_ABBR = {"BART", "MTA", "THE", "AND", "GET", "CAN", "ANY", "ALL", "LAST", "NEXT", "SFO",
                     "OAK", "DEL", "BUD"}
_STATION_WORDS = re.compile(
    r"\b(?:which|what|find|list|any)\s+(?:bart\s+)?stations?\b|\bstations?\s+"
    r"(?:near|in|at|called|named)\b|\bstations?\s+in\b",
    re.IGNORECASE,
)
_CITY_RE = re.compile(
    r"\b(?:bart\s+)?stations?\b(?:\s+is|\s+are)?\s+in\s+"
    r"([A-Z][A-Za-z.'’\-]+(?:\s+[A-Z][A-Za-z.'’\-]+){0,2})"
)
_LAST_TRAIN_WORDS = re.compile(
    r"\b(?:last|catch|catchable|can i (?:still )?(?:get|make|take|board)|"
    r"if i (?:leave|get|am out)|do i (?:still )?have time|make it|"
    r"what can i (?:still )?(?:get|catch|take)|out the door|earliest i can leave|"
    r"not before|after \d+ min)\b",
    re.IGNORECASE,
)
_DISRUPTION_WORDS = re.compile(
    r"\b(?:cancell?ed|delay\w*|late|disrupt\w*|skipping|limited|short[- ]turn|problem\w*|"
    r"is it running|any issues?|running normally|on time)\b",
    re.IGNORECASE,
)
_LINES_WORDS = re.compile(
    r"\b(?:what|which)\s+(?:lines?|trains?|destinations?|directions?)\b|"
    r"\blines?\s+(?:does|do|serve|go|run|are)\b|\bwhere can i go\b|\bgoes (?:from|to)\b|"
    r"\bserves?\b",
    re.IGNORECASE,
)
_ARRIVAL_WORDS = re.compile(
    r"\b(?:next|when (?:is|are|does)|due|arriv\w+|depart\w+|leaving|how long until|how soon)\b",
    re.IGNORECASE,
)
_IN_MINUTES_RE = re.compile(r"\b(?:in|after|within|wait)\s+(\d{1,3})\s*min", re.IGNORECASE)
_AT_MINUTES_RE = re.compile(r"\bnot before\s+(\d{1,3})\s*min", re.IGNORECASE)
_LIMIT_RE = re.compile(r"\b(?:top\s+|next\s+|first\s+)?(\d{1,2})\b(?=\s+(?:trains?|departures?|stations?))", re.IGNORECASE)

HELP = (
    "I read BART's public API: the live departure board, what each station serves, the station "
    "directory, and the cancellations and limited runs on a board. Ask me:\n"
    "  • when is the next train from Embarcadero?\n"
    "  • what lines does Embarcadero serve?\n"
    "  • which bart station is in Berkeley?\n"
    "  • any cancelled trains at PITT?\n"
    "  • if I leave in 20 minutes can I still get to Antioch from EMBR? (premium)\n"
    "Times are BART's own estimates in BART's clock. Stations are three or four letters (EMBR, PITT, "
    "MLBR) or a name. BART's fare command is broken upstream, so I do not quote fares."
)


def message_text(message: dict) -> str:
    parts = message.get("parts") or []
    return " ".join(part.get("text", "") for part in parts if part.get("kind") == "text").strip()


def message_data(message: dict) -> dict:
    merged: dict = {}
    for part in message.get("parts") or []:
        if part.get("kind") == "data" and isinstance(part.get("data"), dict):
            merged.update(part["data"])
    return merged


def _first(params: dict, *names, default=None):
    for name in names:
        if name in params and params[name] not in (None, ""):
            return params[name]
    return default


def _clean_destination(value: str | None) -> str | None:
    """Trim a destination mention to the words BART itself uses.

    BART's destinations carry slashes and apostrophes ("Dublin/Pleasanton",
    "San Francisco Int'l Airport"), so nothing is cut on punctuation. The capture
    stops at the first preposition or bare station abbreviation instead.
    """
    if not value:
        return None
    words: list[str] = []
    for word in re.split(r"[\s,]+", value.strip(" .,'’")):
        if not word:
            continue
        if word.lower() in _DESTINATION_STOP:
            break
        if word.isupper() and len(word) in (3, 4) and word not in ("SFO", "MCO", "OAK", "SJC"):
            break
        words.append(word)
        if len(words) == 4:
            break
    if not words or len(words) < 1:
        return None
    destination = " ".join(words)
    return destination if len(destination) <= 60 else None


def station_from_text(text: str) -> str | None:
    """A station mention: an abbreviation, or a capitalised name after a usual verb."""
    for match in _ABBR_RE.finditer(text):
        candidate = match.group(1)
        if candidate not in _NOT_STATION_ABBR:
            return candidate
    for pattern in (_CALLED_RE, _AFTER_PREPOSITION_RE, _CITY_RE):
        found = pattern.search(text)
        if found:
            name = found.group(1).strip(" .,'’")
            if 2 <= len(name) <= 60 and name.split()[0] not in _NOT_STATION_ABBR:
                return name
    return None


def parse(message: dict) -> dict:
    """Incoming message -> {skill, params, explicit}. Never raises."""
    text = message_text(message)
    data = message_data(message)
    requested = _first(data, "skill", "skill_id")

    station = _first(data, "station", "station_id", "stop", "abbr")
    name = _first(data, "name", "station_name")
    city = _first(data, "city")
    if city is None:
        # "which stations are in Berkeley" asks about a city, not a station called
        # Berkeley, and the two need different matching.
        found = _CITY_RE.search(text)
        if found:
            city = found.group(1).strip(" .,'’")
            station = None
    if station is None and name is None and city is None:
        station = station_from_text(text)
    direction = _first(data, "direction", "destination", "toward")
    if direction is None:
        match = _DESTINATION_WORDS.search(text)
        if match:
            direction = _clean_destination(match.group(1))
    limit = _first(data, "limit")
    if limit is None:
        match = _LIMIT_RE.search(text)
        if match:
            limit = match.group(1)
    not_before = _first(data, "not_before_minutes", "not_before")
    if not_before is None:
        match = _IN_MINUTES_RE.search(text) or _AT_MINUTES_RE.search(text)
        if match:
            not_before = match.group(1)

    asked_for_last = bool(_LAST_TRAIN_WORDS.search(text))
    asked_for_stations = bool(_STATION_WORDS.search(text))
    asked_for_disruption = bool(_DISRUPTION_WORDS.search(text))
    asked_for_lines = bool(_LINES_WORDS.search(text))

    if requested in (SKILL_DEPARTURES, SKILL_LINES, SKILL_STATIONS, SKILL_DELAYS, SKILL_LAST_DEPARTURE):
        skill = requested
    elif asked_for_last and station:
        skill = SKILL_LAST_DEPARTURE
    elif asked_for_stations:
        skill = SKILL_STATIONS
    elif asked_for_disruption and station:
        skill = SKILL_DELAYS
    elif asked_for_lines and station:
        skill = SKILL_LINES
    else:
        skill = SKILL_DEPARTURES

    params: dict = {}
    for key, value in (("station", station), ("name", name), ("city", city),
                       ("direction", direction), ("limit", limit),
                       ("not_before_minutes", not_before)):
        if value is not None:
            params[key] = value
    if skill in (SKILL_DEPARTURES, SKILL_DELAYS):
        params.setdefault("limit", MAX_LISTED)
    if skill == SKILL_LINES:
        params.setdefault("limit", MAX_STATION_LIST)
    if skill == SKILL_LAST_DEPARTURE:
        params.setdefault("limit", MAX_DEPARTURES)
        params.setdefault("not_before_minutes", 0)
    if not requested and (not text.strip() or re.search(r"\b(help|what can you do|commands?)\b", text, re.IGNORECASE)):
        skill, params = "help", {}
    explicit = bool(requested or asked_for_last or asked_for_stations
                    or asked_for_disruption or asked_for_lines or _ARRIVAL_WORDS.search(text))
    return {"skill": skill, "params": params, "explicit": explicit}


# -- shared shape ---------------------------------------------------------


def _artifact(params: dict, client: BartClient, **extra) -> dict:
    artifact = {
        "dataset": DATASET,
        "product": PRODUCT,
        "source": SOURCE,
        "freshness": client.freshness(),
    }
    artifact.update(extra)
    return artifact


def _missing(skill: str) -> dict:
    if skill == SKILL_STATIONS:
        message = (
            "Which stations? Give me a name (Pittsburg Center), a city (Berkeley), or an "
            "abbreviation (EMBR), and I will read BART's directory."
        )
    else:
        message = (
            "Which station? Give me a BART abbreviation such as EMBR, PITT or MLBR, or a name such "
            "as Embarcadero or Pittsburg Center."
        )
    return {"final_state": "input-required", "message": message, "artifact": None, "watch": None}


def _resolve_station(params: dict, client: BartClient) -> tuple[dict | None, dict | None]:
    """(station_record, problem_response) — the problem is a finished response body."""
    wanted = params.get("station")
    if not wanted:
        return None, None
    abbr = str(wanted).strip()
    if re.match(r"^[A-Za-z0-9]{3,4}$", abbr):
        # Already the right shape, so it is looked up directly and a miss is reported
        # as a station BART does not have rather than as a name that failed to match.
        found = client.find_station(abbr)
        if found is None:
            return None, {
                "final_state": "completed",
                "message": (
                    f"BART has no station with the abbreviation “{abbr}”. Ask which stations there "
                    f"are, or give a name such as Embarcadero."
                ),
                "artifact": _artifact(params, client, station=abbr, found=False),
                "watch": None,
            }
        return found, None
    found = client.find_station(abbr)
    if found is not None:
        return found, None
    candidates = client.find_stations(name=abbr, limit=5)
    if not candidates:
        return None, {
            "final_state": "completed",
            "message": (
                f"No BART station matches “{abbr}”. BART has 50 stations; ask which stations are in a "
                f"city, or give a three or four letter abbreviation."
            ),
            "artifact": _artifact(params, client, station_name=abbr, found=False),
            "watch": None,
        }
    if len(candidates) > 1:
        listing = "\n".join(
            f"  • {row.get('abbr')} — {row.get('name')}" + (f", {row['city']}" if row.get("city") else "")
            for row in candidates
        )
        return None, {
            "final_state": "input-required",
            "message": f"“{abbr}” matches more than one BART station. Which one?\n{listing}",
            "artifact": _artifact(params, client, station_name=abbr, candidates=candidates),
            "watch": None,
        }
    return candidates[0], None


def _label(station: dict | None, abbr: str) -> str:
    if station and station.get("name"):
        return f"{station['name']} ({station.get('abbr') or abbr})"
    return abbr


def _row_line(row: dict) -> str:
    platform = f"platform {row['platform']}" if row.get("platform") else "platform not reported"
    direction = f" {row['direction']}" if row.get("direction") else ""
    colour = f", {row['line_colour']} line" if row.get("line_colour") else ""
    flags = []
    if row.get("limited") == "yes":
        flags.append("limited stop")
    if row.get("cancelled") == "yes":
        flags.append("CANCELLED")
    if row.get("live_estimate") == "yes":
        flags.append("live estimate, not scheduled")
    tail = f" — {'; '.join(flags)}" if flags else ""
    return (f"  • in {row['minutes']} min  {row['destination']}{direction}, {platform}{colour}"
            f"  {row.get('length') or '?'} car{tail}")


# -- skills ---------------------------------------------------------------


def run_departures(params: dict, client: BartClient) -> dict:
    station, problem = _resolve_station(params, client)
    if problem:
        return problem
    abbr = station["abbr"]
    board = client.board(abbr, direction=params.get("direction"))
    rows = client.board_rows(abbr, direction=params.get("direction"))
    limit = client.check_limit(params.get("limit", MAX_LISTED))
    label = _label(station, abbr)
    artifact = _artifact(params, client, station=abbr, station_name=board.get("name") or station.get("name"),
                         bart_clock=board.get("clock"), direction=params.get("direction"),
                         departures=rows[:limit], count=len(rows), destinations=board["destinations"])
    if not rows:
        return {
            "final_state": "completed",
            "message": (
                f"BART is publishing no departure estimate for {label} right now, which happens "
                f"outside service hours. Ask which lines the station serves, or which stations are "
                f"near where you are. (Read live from {DATASET}.)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    listing = "\n".join(_row_line(row) for row in rows[:limit])
    through = rows[min(limit, len(rows)) - 1]["minutes"]
    return {
        "final_state": "completed",
        "message": (
            f"{label}, {client.clock_text(board)}:\n{listing}\n"
            f"{len(rows)} train(s) on the board, out to {through} min. That is everything BART is "
            f"estimating — it publishes no timetable. Source: {DATASET} (read live)."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_lines(params: dict, client: BartClient) -> dict:
    station, problem = _resolve_station(params, client)
    if problem:
        return problem
    abbr = station["abbr"]
    board = client.board(abbr)
    label = _label(station, abbr)
    if not board["departures"]:
        return {
            "final_state": "completed",
            "message": (
                f"BART has no departures on the {label} board right now, so it serves no directions "
                f"at this moment. (Read live from {DATASET}.)"
            ),
            "artifact": _artifact(params, client, station=abbr, lines=[]),
            "watch": None,
        }
    summary = []
    for departure in board["departures"]:
        estimates = departure["estimates"]
        platforms = sorted({str(row.get("platform")) for row in estimates if row.get("platform")})
        directions = sorted({str(row.get("direction")) for row in estimates if row.get("direction")})
        colours = sorted({str(row.get("line_colour")) for row in estimates if row.get("line_colour")})
        limited = departure["limited"]
        summary.append({
            "destination": departure["destination"],
            "abbreviation": departure["abbreviation"],
            "directions": directions,
            "platforms": platforms,
            "line_colours": colours,
            "trains_estimating": len(estimates),
            "next_in_minutes": estimates[0]["minutes"],
            "limited": limited,
        })
    summary.sort(key=lambda row: row["next_in_minutes"])
    limit = client.check_limit(params.get("limit", MAX_STATION_LIST), MAX_STATION_LIST)
    listing = "\n".join(
        f"  • {row['destination']}"
        + (f" ({row['abbreviation']})" if row.get("abbreviation") else "")
        + f" — {', '.join(row['directions']) or 'direction not reported'}"
        + f", platform {', '.join(row['platforms']) or 'not reported'}"
        + f", {', '.join(row['line_colours']) or 'colour not reported'} line"
        + f", {row['trains_estimating']} train(s) estimating, next in {row['next_in_minutes']} min"
        + (" — limited" if row["limited"] == "yes" else "")
        for row in summary[:limit]
    )
    return {
        "final_state": "completed",
        "message": (
            f"{label} serves {len(board['destinations'])} destination(s) on the board right now "
            f"({', '.join(board['destinations'])}):\n{listing}\n"
            f"Read off the live board, so a destination absent here is not being served at this "
            f"moment. Source: {DATASET} (read live)."
        ),
        "artifact": _artifact(params, client, station=abbr, station_name=board.get("name"),
                             bart_clock=board.get("clock"), lines=summary, count=len(summary)),
        "watch": None,
    }


def run_delays(params: dict, client: BartClient) -> dict:
    station, problem = _resolve_station(params, client)
    if problem:
        return problem
    abbr = station["abbr"]
    board = client.board(abbr)
    rows = client.board_rows(abbr)
    label = _label(station, abbr)
    troubled = [row for row in rows
                if row.get("cancelled") == "yes" or row.get("limited") == "yes" or row.get("live_estimate") == "yes"]
    artifact = _artifact(params, client, station=abbr, bart_clock=board.get("clock"),
                         trains_on_board=len(rows), troubled=troubled, count=len(troubled))
    if not troubled:
        return {
            "final_state": "completed",
            "message": (
                f"BART is flagging nothing on the {label} board: no cancellations, no limited runs, "
                f"and every estimate is a scheduled time. {len(rows)} train(s) on the board. "
                f"(Read live from {DATASET}.)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    listing = "\n".join(_row_line(row) for row in troubled[:MAX_LISTED])
    cancelled = sum(1 for row in troubled if row.get("cancelled") == "yes")
    limited = sum(1 for row in troubled if row.get("limited") == "yes")
    live = sum(1 for row in troubled if row.get("live_estimate") == "yes")
    return {
        "final_state": "completed",
        "message": (
            f"{len(troubled)} of {len(rows)} train(s) on the {label} board carry a BART flag "
            f"({cancelled} cancelled, {limited} limited, {live} live estimates only):\n{listing}\n"
            f"The flags are BART's own. Source: {DATASET} (read live)."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_stations(params: dict, client: BartClient) -> dict:
    # This skill searches, so "which station is in Berkeley" is a name search, not a
    # request to pick one of them. An abbreviation falls back to a direct lookup.
    name = params.get("name") or params.get("station")
    city = params.get("city")
    matches = client.find_stations(name=name, city=city, limit=params.get("limit", MAX_STATION_LIST))
    if not matches and params.get("station"):
        found = client.find_station(params["station"])
        if found:
            matches = [found]
    artifact = _artifact(params, client, name=name, city=city, station_matches=matches, count=len(matches))
    if not matches:
        return {
            "final_state": "completed",
            "message": (
                f"No BART station matches that. The directory holds 50 stations; try a city such as "
                f"Berkeley, or a name such as MacArthur."
            ),
            "artifact": artifact,
            "watch": None,
        }
    listing = "\n".join(
        f"  • {row.get('abbr')} — {row.get('name')}"
        + (f", {row['city']}" if row.get("city") else "")
        + (f", {row['state']}" if row.get("state") else "")
        for row in matches[:MAX_STATION_LIST]
    )
    return {
        "final_state": "completed",
        "message": f"{len(matches)} BART station(s):\n{listing}\nSource: {DATASET} (read live).",
        "artifact": artifact,
        "watch": None,
    }


def run_last_departure(params: dict, client: BartClient, gateway: GatewayClient) -> dict:
    """The premium catchability answer. The work happens on the gateway.

    Nothing here reads the board: the gateway does the work behind its licence check
    and hands back the trains you can still catch, so a caller who has not paid gets
    the gateway's own message and no answer.
    """
    station, problem = _resolve_station(params, client)
    if problem:
        return problem
    abbr = station["abbr"]
    try:
        limit = client.check_limit(params.get("limit") or MAX_DEPARTURES)
        not_before = client.check_minutes(params.get("not_before_minutes", 0))
        direction = client.check_direction(params.get("direction"))
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}

    label = _label(station, abbr)
    arguments: dict = {"station": abbr, "not_before_minutes": not_before, "limit": limit}
    if direction:
        arguments["direction"] = direction
    read, refused = premium_call(gateway, "a2a_bart_last_departure", arguments, {
        "dataset": DATASET, "station": abbr, "place": label, "direction": direction,
    })
    if refused:
        return refused
    if not isinstance(read, dict) or not read.get("catchable_count"):
        return empty_premium_answer(
            "The licence gateway answered without any BART departures, so there is nothing to catch.",
            {"dataset": DATASET, "station": abbr, "place": label},
        )

    last = read.get("last_catchable") or {}
    clock = read.get("bart_clock") or {}
    lines = [
        f"What you can still catch from {label} ({read.get('station') or abbr}), "
        f"{clock.get('date') or 'date not reported'} {clock.get('time') or ''} BART time, "
        f"if you cannot leave for {not_before} min and you are going {read.get('direction')}:",
    ]
    for departure in (read.get("departures") or [])[:MAX_LISTED]:
        line = (f"  • in {departure.get('minutes')} min  {departure.get('destination')}"
                + (f", platform {departure['platform']}" if departure.get("platform") else "")
                + (f", {departure.get('line_colour')} line" if departure.get("line_colour") else ""))
        if departure.get("limited"):
            line += " — limited stop"
        if departure.get("cancelled"):
            line += " — CANCELLED"
        lines.append(line)
    lines.append(
        f"  • {read.get('catchable_count')} train(s) still on the board"
        + (f"; the last one leaves in {last.get('minutes')} min"
           f" toward {last.get('destination')}"
           + (f" from platform {last['platform']}" if last.get("platform") else "")
           + "." if last.get("minutes") is not None else ".")
    )
    board_last = read.get("board_last_overall") or {}
    if board_last and not direction:
        lines.append(
            f"  • The last train on the whole board leaves in {board_last.get('minutes')} min toward "
            f"{board_last.get('destination')}."
        )
    lines.append(
        f"\nWorked out on the MCP gateway behind its licence check, from BART's live departure "
        f"board ({DATASET}). BART's board holds a handful of estimates and no timetable, so this is "
        f"the board as it stands, not a promise about later trains."
    )
    artifact = {
        "dataset": DATASET,
        "source": SOURCE,
        "premium": True,
        "station": abbr,
        "place": label,
        "direction": read.get("direction"),
        "not_before_minutes": not_before,
        "bart_clock": clock,
        "departures_read": read.get("departures_read"),
        "departures": read.get("departures"),
        "catchable_count": read.get("catchable_count"),
        "last_catchable": last,
        "board_last_overall": board_last or None,
    }
    return {"final_state": "completed", "message": "\n".join(lines), "artifact": artifact, "watch": None}


class BartAgent(SkillAgent):
    name = "bart"
    card_name = "BART Transit Agent"
    card_description = (
        "Read-only agent over BART's public API: the live departure board at any of its 50 stations, "
        "the destinations and platforms that station serves, the station directory by name or city, "
        "and the cancellations and limited runs BART is flagging — in BART's own clock and with BART's "
        "own flags. One premium skill answers the catchability question from that board, and it runs "
        "behind a licence check on the gateway."
    )
    env_prefix = "BART"
    datasets = (DATASET,)
    card_skills = CARD_SKILLS

    def __init__(self, client: BartClient | None = None, gateway: GatewayClient | None = None) -> None:
        self.client = client or BartClient()
        self.gateway = gateway or GatewayClient()

    def parse(self, message: dict) -> dict:
        return parse(message)

    def missing(self, skill: str, params: dict) -> list[str]:
        if skill == SKILL_STATIONS:
            has_place = any(params.get(key) for key in ("name", "city", "station"))
            return [] if has_place else ["place"]
        if skill in (SKILL_DEPARTURES, SKILL_LINES, SKILL_DELAYS, SKILL_LAST_DEPARTURE):
            return [] if params.get("station") else ["station"]
        return []

    def input_prompt(self, skill: str, missing: list[str]) -> str:
        return _missing(skill)["message"]

    def run(self, request: dict) -> dict:
        skill = request["skill"]
        params = request["params"]
        if request["missing"]:
            return {
                "final_state": "input-required",
                "message": self.input_prompt(skill, request["missing"]),
                "artifact": None,
                "watch": None,
            }
        try:
            if skill == SKILL_LAST_DEPARTURE:
                return run_last_departure(params, self.client, self.gateway)
            if skill == SKILL_DEPARTURES:
                return run_departures(params, self.client)
            if skill == SKILL_LINES:
                return run_lines(params, self.client)
            if skill == SKILL_DELAYS:
                return run_delays(params, self.client)
            if skill == SKILL_STATIONS:
                return run_stations(params, self.client)
        except UpstreamError as exc:
            return {"final_state": "failed", "message": str(exc), "artifact": None, "watch": None}
        except ValueError as exc:
            return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
        return {"final_state": "completed", "message": HELP, "artifact": None, "watch": None}


__all__ = [
    "CARD_SKILLS",
    "DATASET",
    "HELP",
    "MAX_LISTED",
    "BartAgent",
    "BartClient",
    "SKILL_DELAYS",
    "SKILL_DEPARTURES",
    "SKILL_LAST_DEPARTURE",
    "SKILL_LINES",
    "SKILL_STATIONS",
    "UpstreamError",
    "message_data",
    "message_text",
    "parse",
    "run_delays",
    "run_departures",
    "run_last_departure",
    "run_lines",
    "run_stations",
    "station_from_text",
]
