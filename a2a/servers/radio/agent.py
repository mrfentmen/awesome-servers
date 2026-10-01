"""The radio-browser agent: four free skills and one premium one.

  - stations-find:   find stations by name, country or genre tag
  - station-detail:  one station's full record, by its radio-browser uuid
  - stations-near:   stations around a latitude/longitude point, nearest first
  - genre-list:      the genres the directory indexes, with station counts
  - station-roster:  a shortlist drawn from several genres at once - premium

Station-roster is the one question the free skills cannot answer. `stations-find`
reads one query and hands back what the mirror matched, duplicates and dead streams
included. A roster has to read several genres at once, drop what failed its last
check, remove the stations that turn up under more than one tag, and rank what is
left, so that work runs behind the licence gateway and a caller who has not paid
gets the gateway's own message and no stations at all.

There is no now-playing skill here, and there cannot be: radio-browser is a
directory of stream URLs, and it publishes no ICY track metadata. Nothing in this
server will guess what a station is playing.
"""

from __future__ import annotations

import os
import re

from a2a_kit import GatewayClient, SkillAgent, UpstreamError, empty_premium_answer, premium_call

from data import (
    DATASET,
    KNOWN_TAGS,
    SOURCE,
    RadioBrowserClient,
)

SKILL_STATIONS_FIND = "stations-find"
SKILL_STATION_DETAIL = "station-detail"
SKILL_STATIONS_NEAR = "stations-near"
SKILL_GENRE_LIST = "genre-list"
SKILL_STATION_ROSTER = "station-roster"

DEFAULT_LIMIT = 10
MAX_LISTED = 20

CARD_SKILLS = [
    {
        "id": SKILL_STATIONS_FIND,
        "name": "Find radio stations",
        "description": (
            "Find internet radio stations by name, by two-letter country code, or by genre tag "
            "(jazz, blues, electronic, news). Each result carries its stream codec and bitrate, "
            "listener votes and clicks, its tags, its resolved stream URL, and whether the directory's "
            "last check found the stream working."
        ),
        "tags": ["radio", "stations", "search", "genre", "country", "radio-browser"],
        "examples": [
            "find jazz radio stations",
            "radio stations in Germany called wdr",
            '{"skill": "stations-find", "tag": "blues", "country": "US", "limit": 10}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_STATION_DETAIL,
        "name": "One station's record",
        "description": (
            "One station's full radio-browser record by uuid: name, country and state, language, "
            "codec, bitrate, every tag, stream URL, homepage, listener votes and clicks, and the "
            "directory's last check on the stream."
        ),
        "tags": ["radio", "station", "detail", "uuid", "radio-browser"],
        "examples": [
            "station detail for uuid 7c1a1a1a-1111-2222-3333-444455556666",
            '{"skill": "station-detail", "uuid": "7c1a1a1a-1111-2222-3333-444455556666"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_STATIONS_NEAR,
        "name": "Stations near a point",
        "description": (
            "Stations around a latitude/longitude point, nearest first, with the distance the directory "
            "measured and whether each stream worked on the last check. Useful for 'what can I actually "
            "hear from here'."
        ),
        "tags": ["radio", "near", "distance", "point", "radio-browser"],
        "examples": [
            "which radio stations are near 40.7006,-74.0142?",
            '{"skill": "stations-near", "point": "52.52,13.405", "limit": 10}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_GENRE_LIST,
        "name": "What genres exist",
        "description": (
            "The genres radio-browser indexes, most stations first, with the number of stations each "
            "one has. The directory's own vocabulary, so a tag this answers is a tag the next skill "
            "will accept."
        ),
        "tags": ["radio", "genres", "tags", "vocabulary", "radio-browser"],
        "examples": [
            "what genres of radio station are there?",
            "list the radio-browser tags",
            '{"skill": "genre-list", "limit": 20, "known_only": true}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_STATION_ROSTER,
        "name": "Multi-genre station roster",
        "description": (
            "A shortlist drawn from up to four genres at once: reads each genre, drops the streams that "
            "failed the directory's last check, removes the stations that appear under more than one "
            "tag, ranks what is left by listener votes and bitrate, and reports how many candidates each "
            "genre contributed and what was removed. Premium: it runs behind a licence check."
        ),
        "tags": ["radio", "roster", "shortlist", "genres", "premium"],
        "examples": [
            "give me a roster of jazz, blues and soul stations for tonight",
            '{"skill": "station-roster", "tags": "jazz,blues,soul", "country": "US", "limit": 20}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
]

_UUID_RE = re.compile(r"\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b", re.IGNORECASE)
_COUNTRY_RE = re.compile(r"\b(?:in|from|of|within)\s+(?:the\s+)?([A-Za-z]{2})\b")
_COUNTRY_NAMES = {
    "us": "US", "usa": "US", "united states": "US", "america": "US",
    "gb": "GB", "uk": "GB", "britain": "GB", "england": "GB", "scotland": "GB", "wales": "GB",
    "de": "DE", "germany": "DE", "deutschland": "DE",
    "fr": "FR", "france": "FR", "es": "ES", "spain": "ES", "it": "IT", "italy": "IT",
    "nl": "NL", "netherlands": "NL", "holland": "NL", "se": "SE", "sweden": "SE",
    "no": "NO", "norway": "NO", "dk": "DK", "denmark": "DK", "fi": "FI", "finland": "FI",
    "pl": "PL", "poland": "PL", "pt": "PT", "portugal": "PT", "ie": "IE", "ireland": "IE",
    "ca": "CA", "canada": "CA", "au": "AU", "australia": "AU", "nz": "NZ",
    "br": "BR", "brazil": "BR", "mx": "MX", "mexico": "MX", "at": "AT", "austria": "AT",
    "ch": "CH", "switzerland": "CH", "be": "BE", "belgium": "BE", "cz": "CZ", "gr": "GR",
}
_POINT_RE = re.compile(r"\b(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\b")
_LIMIT_RE = re.compile(r"\b(?:top|first|limit|last)\s+(\d{1,3})\b", re.IGNORECASE)
_KNOWN_ONLY_RE = re.compile(r"\b(common|popular|main|known|real)\b", re.IGNORECASE)
_GENRE_ONLY_RE = re.compile(r"\b(?:only|just)\s+(?:the\s+)?(?:common|popular|main|known|real)\b",
                            re.IGNORECASE)
_NEAR_WORDS = re.compile(
    r"\b(?:near|nearby|close to|around|within \d+\s*(?:km|mi|miles|kilometres?|kilometers?)? of|"
    r"from (?:here|my|location)|local to)\b",
    re.IGNORECASE,
)
_DETAIL_WORDS = re.compile(
    r"\b(details?|more about|what is|whats|info(?:rmation)? on|record for|"
    r"tell me about)\b",
    re.IGNORECASE,
)
_GENRE_LIST_WORDS = re.compile(
    r"\b(?:what|which)\s+(?:genres?|tags?|kinds? of (?:radio|music|station))\b|"
    r"\bgenres? (?:are there|list|available|exist)|"
    r"\blist (?:the )?(?:[a-z'\-]+\s+){0,3}(?:genres?|tags?)\b|"
    r"\b(?:radio[- ]browser )?tags? (?:does|do) .* (?:index|have|list)|"
    r"\bwhat can i (?:search|ask) (?:for|by)\b",
    re.IGNORECASE,
)
#: The premium skill asks for a shortlist built out of several genres, which no single
#: search can answer. Deliberately narrow: one genre stays with stations-find.
_ROSTER_WORDS = re.compile(
    r"\b(roster|shortlist|line[- ]?up|playlist of stations|"
    r"stations for (?:tonight|today|this (?:evening|weekend|afternoon))|"
    r"(?:mix|selection|batch) of (?:stations|the best)|"
    r"from (?:several|multiple|a few|different) genres?|"
    r"(?:across|combining|combining across) .{0,30}genres?|"
    r"all (?:the )?(?:best|good) stations for|"
    r"give me .{0,30}stations? (?:to|for) (?:try|listen)|"
    r"(?:pick|choose|choose me) \d{1,2} stations)\b",
    re.IGNORECASE,
)
_QUOTED_RE = re.compile(r"[\"“”'‘’]([^\"“”]{2,60})[\"“”'‘’]")
_TITLE_WORD = r"[A-Z][A-Za-z0-9'’.\-&]{0,30}"
_CAPITALISED_RE = re.compile(
    rf"\b({_TITLE_WORD}(?:(?:\s+(?:of|the|and|&)\s+|\s+){_TITLE_WORD}){{0,5}})"
)
_ALL_SKILLS = (SKILL_STATIONS_FIND, SKILL_STATION_DETAIL, SKILL_STATIONS_NEAR,
               SKILL_GENRE_LIST, SKILL_STATION_ROSTER)

HELP = (
    "I read radio-browser, the open directory of internet radio stations. Ask me:\n"
    "  • find jazz radio stations\n"
    "  • radio stations in Germany called wdr\n"
    "  • station detail for uuid 7c1a1a1a-1111-2222-3333-444455556666\n"
    "  • which radio stations are near 40.7006,-74.0142?\n"
    "  • what genres of radio station are there?\n"
    "  • give me a roster of jazz, blues and soul stations for tonight\n"
    "Streams, bitrates and votes are the directory's own, read live, and I say whether each "
    "stream worked on the last check. I cannot tell you what a station is playing: the "
    "directory publishes stream URLs, not track data."
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


def country_from_text(text: str) -> str | None:
    """A two-letter country code, from the code or from the country's English name."""
    lowered = text.lower()
    for name in sorted(_COUNTRY_NAMES, key=len, reverse=True):
        if re.search(rf"\b{re.escape(name)}\b", lowered):
            return _COUNTRY_NAMES[name]
    match = _COUNTRY_RE.search(text)
    if match:
        code = match.group(1).upper()
        if code in _COUNTRY_NAMES.values():
            return code
    return None


def tags_from_text(text: str) -> list[str]:
    """Genres named in the text, as radio-browser tags.

    The text is scanned for words in the directory's own vocabulary rather than
    parsed for a list, so "jazz", "jazz, blues and soul" and "jazz/blues" all read the
    same way. Anything outside KNOWN_TAGS is refused, because the tag goes straight
    to the mirror and an invented tag simply matches nothing.
    """
    found: list[str] = []
    quoted = " ".join(_QUOTED_RE.findall(text))
    tokens = re.sub(r"[^a-z]+", " ", f"{quoted} {text}".lower()).split()
    # A tag can be two words ("hip hop"), so adjacent pairs are checked too.
    candidates = list(tokens)
    candidates += [f"{tokens[i]} {tokens[i + 1]}" for i in range(len(tokens) - 1)]
    for candidate in candidates:
        tag = candidate.strip(" &'-+")
        if tag in KNOWN_TAGS and tag not in found:
            found.append(tag)
        if len(found) == 4:
            break
    return found


def station_from_text(text: str, station: str | None) -> str | None:
    """A station name only when the text offers one - never the whole question."""
    if station:
        return None
    quoted = _QUOTED_RE.search(text)
    if quoted:
        return quoted.group(1).strip(" .,'’")
    match = re.search(r"\bcalled\s+([A-Za-z0-9][A-Za-z0-9 .,'’&\-_()!]{1,60})", text, re.IGNORECASE)
    if match:
        candidate = match.group(1).strip(" .,'’")
        # A name ends where the place clause begins: "called Jazz FM in the US" is a
        # station called Jazz FM, not one called "Jazz FM in the US".
        candidate = re.split(r"\s+(?:in|from|near|playing)\s+", candidate, maxsplit=1)[0].strip(" .,'’")
        if candidate.lower() not in ("a", "the") and candidate:
            return candidate
    return None


def parse(message: dict) -> dict:
    """Incoming message -> {skill, params, explicit}. Never raises."""
    text = message_text(message)
    data = message_data(message)
    requested = _first(data, "skill", "skill_id")

    station = _first(data, "station", "station_name", "name")
    station_uuid = _first(data, "uuid", "stationuuid", "station_uuid")
    if station_uuid is None:
        match = _UUID_RE.search(text)
        if match:
            station_uuid = match.group(0)
    tag = _first(data, "tag", "genre")
    tags = _first(data, "tags", "genres")
    country = _first(data, "country", "country_code", "countrycode")
    if country is None:
        country = country_from_text(text)
    point = _first(data, "point", "lat_lon")
    if point is None:
        match = _POINT_RE.search(text)
        if match:
            point = re.sub(r"\s+", "", match.group(0))
    order = _first(data, "order")
    healthy = _first(data, "healthy", "hidebroken", "working")
    known_only = _first(data, "known_only", "common_only")
    if known_only is None:
        known_only = bool(_GENRE_ONLY_RE.search(text)) or bool(_KNOWN_ONLY_RE.search(text))
    limit = _first(data, "limit", default=DEFAULT_LIMIT)
    if limit == DEFAULT_LIMIT:
        match = _LIMIT_RE.search(text)
        if match:
            limit = match.group(1)

    if station is None:
        station = station_from_text(text, None)
    # A station name and a genre tag together would ask the mirror for stations that
    # are both, which is narrower than the question, so a named station wins.
    named_tags = [] if station else tags_from_text(text)
    if tag is None:
        tag = named_tags[0] if named_tags else None
    if tags is None and named_tags:
        tags = ",".join(named_tags)

    asks_roster = bool(_ROSTER_WORDS.search(text))
    asks_genres = bool(_GENRE_LIST_WORDS.search(text))
    asks_near = bool(_NEAR_WORDS.search(text))

    if requested in _ALL_SKILLS:
        skill = requested
    elif asks_roster:
        skill = SKILL_STATION_ROSTER
    elif station_uuid is not None or (_DETAIL_WORDS.search(text) and station_uuid):
        skill = SKILL_STATION_DETAIL
    elif asks_genres:
        skill = SKILL_GENRE_LIST
    elif asks_near and point:
        skill = SKILL_STATIONS_NEAR
    elif station or tag or country:
        skill = SKILL_STATIONS_FIND
    elif point:
        skill = SKILL_STATIONS_NEAR
    else:
        skill = SKILL_STATIONS_FIND

    params: dict = {"limit": limit}
    for key, value in (("station", station), ("uuid", station_uuid), ("tag", tag), ("tags", tags),
                       ("country", country), ("point", point), ("order", order), ("healthy", healthy)):
        if value is not None:
            params[key] = value
    if known_only:
        params["known_only"] = True

    if not requested and (not text.strip() or re.search(r"\b(help|what can you do|commands?)\b", text, re.IGNORECASE)):
        skill, params = "help", {}
    explicit = bool(requested or asks_roster or asks_genres or asks_near
                    or station or tag or country or point or station_uuid)
    return {"skill": skill, "params": params, "explicit": explicit}


# -- shared shape ---------------------------------------------------------


def _artifact(params: dict, client: RadioBrowserClient, **extra) -> dict:
    artifact = {
        "dataset": DATASET,
        "product": "radio-browser open internet-radio directory",
        "source": SOURCE,
        "freshness": client.freshness(),
    }
    artifact.update(extra)
    return artifact


def _needs_a_filter() -> dict:
    return {
        "final_state": "input-required",
        "message": (
            "What am I looking for? Give me a genre such as jazz or blues, a station name, a "
            "two-letter country code such as DE, or a point like 40.7,-74.0."
        ),
        "artifact": None,
        "watch": None,
    }


def _needs_genres() -> dict:
    return {
        "final_state": "input-required",
        "message": (
            "Which genres? Name up to four, the way radio-browser tags them: jazz, blues, soul, "
            "electronic."
        ),
        "artifact": None,
        "watch": None,
    }


def _station_line(station: dict) -> str:
    bits = [f"  • {station.get('name') or 'name not reported'}"]
    where = station.get("country") or station.get("countrycode")
    if station.get("state") and where:
        bits.append(f"{station['state']}, {where}")
    elif where:
        bits.append(str(where))
    if station.get("distance_km") is not None:
        bits.append(f"{station['distance_km']} km away")
    bits.append(f"{station.get('codec') or 'codec not reported'}"
                + (f" {station['bitrate_kbps']} kbps" if station.get("bitrate_kbps") else ""))
    if station.get("votes") is not None:
        bits.append(f"{station['votes']} votes")
    tags = ", ".join((station.get("tags_list") or [])[:4])
    if tags:
        bits.append(tags)
    bits.append(station.get("health") or "health not reported")
    line = " - ".join(str(bit) for bit in bits)
    if station.get("uuid"):
        line += f" (uuid {station['uuid']})"
    return line


# -- skills ---------------------------------------------------------------


def run_stations_find(params: dict, client: RadioBrowserClient) -> dict:
    station = params.get("station")
    tag = params.get("tag")
    country = params.get("country")
    if not (station or tag or country):
        return _needs_a_filter()
    try:
        healthy = client.check_healthy(params["healthy"]) if params.get("healthy") is not None else None
        order = client.check_order(params.get("order"))
        stations = client.search(name=station, country=country, tag=tag, order=order,
                                 healthy=healthy, limit=params.get("limit", DEFAULT_LIMIT))
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    where = ", ".join(part for part in (f"named “{station}”" if station else "",
                                        f"tagged {tag}" if tag else "",
                                        f"in {country}" if country else "") if part)
    artifact = _artifact(params, client, filters={"name": station, "tag": tag, "country": country},
                         order=order, healthy_only=bool(healthy), stations=stations, count=len(stations))
    if not stations:
        return {
            "final_state": "completed",
            "message": (
                f"radio-browser has no station {where}."
                f" (Read live from {DATASET}.)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    healthy_count = sum(1 for row in stations if row.get("healthy"))
    return {
        "final_state": "completed",
        "message": (
            f"{len(stations)} radio-browser station(s) {where}, ranked by {order} "
            f"({healthy_count} of them worked on the last check):\n"
            + "\n".join(_station_line(row) for row in stations[:MAX_LISTED])
            + f"\nSource: {DATASET} (read live). An internet-radio directory is mostly dead streams, "
            "so the health line is the one to read."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_station_detail(params: dict, client: RadioBrowserClient) -> dict:
    station_uuid = params.get("uuid")
    if not station_uuid:
        return {
            "final_state": "input-required",
            "message": (
                "Which station? Give me its radio-browser uuid, which looks like "
                "7c1a1a1a-1111-2222-3333-444455556666."
            ),
            "artifact": None,
            "watch": None,
        }
    station = client.station(station_uuid)
    if station is None:
        return {
            "final_state": "completed",
            "message": (
                f"radio-browser does not hold a station with uuid {station_uuid}. Search for it by "
                f"name, country or genre and take the uuid from a result. (Read live from {DATASET}.)"
            ),
            "artifact": _artifact(params, client, uuid=station_uuid, station=None),
            "watch": None,
        }
    tags = ", ".join(station.get("tags_list") or []) or "no tags recorded"
    lines = [
        f"  • Name: {station.get('name') or 'not reported'}",
        f"  • Place: {(station.get('state') + ', ') if station.get('state') else ''}"
        f"{station.get('country') or 'country not reported'}"
        + (f" ({station['countrycode']})" if station.get("countrycode") else ""),
        f"  • Language: {station.get('language') or 'not reported'}",
        f"  • Stream: {station.get('codec') or 'codec not reported'}"
        + (f" at {station['bitrate_kbps']} kbps" if station.get("bitrate_kbps") else "")
        + (f", HLS" if station.get("hls") else ""),
        f"  • Health: {station.get('health')}"
        + (f" at {station['lastcheckoktime']}" if station.get("lastcheckoktime") else ""),
        f"  • Votes: {station.get('votes') if station.get('votes') is not None else 'not reported'}"
        f" - clicks: {station.get('clickcount') if station.get('clickcount') is not None else 'not reported'}",
        f"  • Tags: {tags}",
        f"  • Stream URL: {station.get('stream_url') or 'not reported'}",
    ]
    if station.get("homepage"):
        lines.append(f"  • Homepage: {station['homepage']}")
    if station.get("geo_lat") is not None and station.get("geo_long") is not None:
        lines.append(f"  • Position: {station['geo_lat']}, {station['geo_long']}")
    if station.get("lastchecktime"):
        lines.append(f"  • Last checked: {station['lastchecktime']}")
    return {
        "final_state": "completed",
        "message": (
            f"radio-browser record for {station.get('name') or station_uuid} (uuid {station_uuid}):\n"
            + "\n".join(lines)
            + f"\nSource: {DATASET} (read live)."
        ),
        "artifact": _artifact(params, client, uuid=station_uuid, station=station),
        "watch": None,
    }


def run_stations_near(params: dict, client: RadioBrowserClient) -> dict:
    point = params.get("point")
    if not point:
        return {
            "final_state": "input-required",
            "message": (
                "Near where? Give me a point as 'lat,lon', for example 40.7006,-74.0142."
            ),
            "artifact": None,
            "watch": None,
        }
    try:
        stations = client.search(point=point, order=params.get("order") or "clickcount",
                                 limit=params.get("limit", DEFAULT_LIMIT))
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    artifact = _artifact(params, client, point=point, stations=stations, count=len(stations),
                         distance_source="computed from the directory's own coordinates")
    if not stations:
        return {
            "final_state": "completed",
            "message": (
                f"radio-browser holds no station with coordinates near {point}. Plenty of stations "
                f"have no position at all, so a small town can come back empty. "
                f"(Read live from {DATASET}.)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    measured = sum(1 for row in stations if row.get("distance_km") is not None)
    return {
        "final_state": "completed",
        "message": (
            f"{len(stations)} radio-browser station(s) near {point}, nearest first "
            f"({measured} with a measured distance):\n"
            + "\n".join(_station_line(row) for row in stations[:MAX_LISTED])
            + f"\nSource: {DATASET} (read live). The search asked the directory for stations that hold "
            "coordinates at all, and the distance is worked out from those coordinates."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_genre_list(params: dict, client: RadioBrowserClient) -> dict:
    known_only = bool(params.get("known_only"))
    tags = client.top_tags(limit=params.get("limit", DEFAULT_LIMIT), only_known=known_only)
    artifact = _artifact(params, client, tags=tags, count=len(tags), known_only=known_only,
                         scope="most stations first")
    if not tags:
        return {
            "final_state": "completed",
            "message": (
                "radio-browser published no tags for that ask. (Read live from "
                f"{DATASET}.)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    lines = []
    for row in tags[:MAX_LISTED]:
        count = row["stations"] if row["stations"] is not None else "count not reported"
        lines.append(f"  • {row['tag']} - {count} station(s)")
    return {
        "final_state": "completed",
        "message": (
            f"{len(tags)} radio-browser genre tag(s), most stations first"
            + (", filtered to the common ones" if known_only else "")
            + ":\n" + "\n".join(lines)
            + f"\nSource: {DATASET} (read live). The directory's own tag vocabulary: a tag from this "
            "list is what the station search accepts."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_station_roster(params: dict, client: RadioBrowserClient, gateway: GatewayClient) -> dict:
    """The premium multi-genre roster. The reading and the filtering run on the gateway.

    Nothing here queries the directory: the gateway reads each genre, drops the streams
    that failed their last check, removes duplicates and ranks what is left behind its
    licence check, so a caller who has not paid gets the gateway's own message and no
    stations at all.
    """
    raw_tags = params.get("tags") or params.get("tag")
    if not raw_tags:
        return _needs_genres()
    try:
        tags = [client.check_tag(part) for part in str(raw_tags).split(",") if part.strip()]
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    if not tags:
        return _needs_genres()
    if len(tags) > 4:
        return {
            "final_state": "input-required",
            "message": "Name up to four genres at a time; the directory throttles bursts.",
            "artifact": None,
            "watch": None,
        }
    arguments = {"tags": ",".join(tags)}
    try:
        if params.get("country"):
            arguments["country"] = client.check_country(params["country"])
        if params.get("limit") is not None:
            arguments["limit"] = client.check_limit(params["limit"], default=20)
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}

    read, refused = premium_call(gateway, "radio_station_roster", arguments, {
        "dataset": DATASET, "tags": ",".join(tags),
    })
    if refused:
        return refused
    if not isinstance(read, dict) or not read.get("stations"):
        return empty_premium_answer(
            "The licence gateway answered without any stations, so there is nothing to report.",
            {"dataset": DATASET, "tags": ",".join(tags)},
        )

    stations = read.get("stations") or []
    scope = read.get("country") or "every country"
    lines = [
        f"Roster from {len(read.get('perTag') or [])} genre(s) for {scope}: "
        f"{read.get('returned')} station(s) out of {read.get('candidatesFound')} candidates, "
        f"{read.get('duplicatesRemoved')} duplicate(s) removed.",
    ]
    for station in stations[:MAX_LISTED]:
        bits = [f"  • {station.get('name') or 'name not reported'}"]
        if station.get("countryName") or station.get("country"):
            bits.append(str(station.get("countryName") or station.get("country")))
        bits.append(f"{station.get('codec') or 'codec not reported'}"
                    + (f" {station['bitrate']} kbps" if station.get("bitrate") else ""))
        if station.get("votes") is not None:
            bits.append(f"{station['votes']} votes")
        if station.get("matchedTags"):
            bits.append(f"matched {', '.join(station['matchedTags'])}")
        lines.append(" - ".join(str(bit) for bit in bits))
    if len(stations) > MAX_LISTED:
        lines.append(f"  • ... {len(stations) - MAX_LISTED} more station(s) are in the artifact.")
    for row in (read.get("perTag") or [])[:MAX_LISTED]:
        lines.append(
            f"  • {row.get('tag')}: {row.get('candidates')} candidate(s), {row.get('added')} added."
        )
    if read.get("medianBitrate") is not None:
        lines.append(f"  • Median bitrate {read['medianBitrate']} kbps across "
                     f"{read.get('distinctCountries')} country code(s) in the shortlist.")
    lines.append(
        "\nComputed on the MCP gateway behind its licence check, from the radio-browser directory "
        f"({DATASET}). Every station was working on the directory's last check at the moment it was "
        "read; streams go down without notice, so try the first few first."
    )
    artifact = {
        "dataset": DATASET,
        "source": SOURCE,
        "premium": True,
        "tags": read.get("tags") or tags,
        "country": read.get("country"),
        "candidates_found": read.get("candidatesFound"),
        "duplicates_removed": read.get("duplicatesRemoved"),
        "returned": read.get("returned"),
        "distinct_countries": read.get("distinctCountries"),
        "median_bitrate": read.get("medianBitrate"),
        "per_tag": read.get("perTag"),
        "stations": stations,
    }
    return {"final_state": "completed", "message": "\n".join(lines), "artifact": artifact, "watch": None}


class RadioBrowserAgent(SkillAgent):
    name = "radio-browser"
    card_name = "Radio Browser Agent"
    card_description = (
        "Read-only agent over radio-browser, the open directory of internet radio stations: search by "
        "name, country or genre tag, one station's full record by uuid, the stations nearest a point "
        "with the directory's own distances, and the genre vocabulary the directory indexes. Every "
        "answer is read live and says whether each stream worked on the last check."
    )
    env_prefix = "RADIO_BROWSER"
    datasets = (DATASET,)
    card_skills = CARD_SKILLS

    def __init__(self, client: RadioBrowserClient | None = None,
                 gateway: GatewayClient | None = None) -> None:
        self.client = client or RadioBrowserClient()
        # The documented <PREFIX>_GATEWAY_URL override is passed in explicitly:
        # the shared client otherwise only looks at A2A_GATEWAY_URL.
        self.gateway = gateway or GatewayClient(url=os.environ.get(f"{self.env_prefix}_GATEWAY_URL"))

    def parse(self, message: dict) -> dict:
        return parse(message)

    def missing(self, skill: str, params: dict) -> list[str]:
        if skill == SKILL_STATION_ROSTER:
            return [] if (params.get("tags") or params.get("tag")) else ["tags"]
        if skill == SKILL_STATIONS_FIND:
            return [] if any(params.get(key) for key in ("station", "tag", "country")) else ["filter"]
        if skill == SKILL_STATIONS_NEAR:
            return [] if params.get("point") else ["point"]
        if skill == SKILL_STATION_DETAIL:
            return [] if params.get("uuid") else ["uuid"]
        return []

    def input_prompt(self, skill: str, missing: list[str]) -> str:
        if skill == SKILL_STATION_ROSTER:
            return _needs_genres()["message"]
        if skill == SKILL_STATIONS_FIND:
            return _needs_a_filter()["message"]
        if skill == SKILL_STATIONS_NEAR:
            return "Near where? Give me a point as 'lat,lon', for example 40.7006,-74.0142."
        return (
            "Which station? Give me its radio-browser uuid, which looks like "
            "7c1a1a1a-1111-2222-3333-444455556666."
        )

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
        if skill == SKILL_STATION_ROSTER:
            return run_station_roster(params, self.client, self.gateway)
        if skill == SKILL_STATION_DETAIL:
            return run_station_detail(params, self.client)
        if skill == SKILL_STATIONS_NEAR:
            return run_stations_near(params, self.client)
        if skill == SKILL_GENRE_LIST:
            return run_genre_list(params, self.client)
        if skill == SKILL_STATIONS_FIND:
            return run_stations_find(params, self.client)
        return {"final_state": "completed", "message": HELP, "artifact": None, "watch": None}


__all__ = [
    "CARD_SKILLS",
    "DEFAULT_LIMIT",
    "HELP",
    "KNOWN_TAGS",
    "MAX_LISTED",
    "SKILL_GENRE_LIST",
    "SKILL_STATION_DETAIL",
    "SKILL_STATION_ROSTER",
    "SKILL_STATIONS_FIND",
    "SKILL_STATIONS_NEAR",
    "RadioBrowserAgent",
    "UpstreamError",
    "country_from_text",
    "message_data",
    "message_text",
    "parse",
    "run_genre_list",
    "run_station_detail",
    "run_station_roster",
    "run_stations_find",
    "run_stations_near",
    "station_from_text",
    "tags_from_text",
]
