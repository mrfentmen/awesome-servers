"""The bike-share agent: four free skills over Citi Bike's GBFS feeds, one on a hosted service that was removed.

  - bikes-near:     bikes and free docks at the stations around a point
  - nearest-stations: the closest stations to a point, whatever state they are in
  - station-lookup: one station by id, short name or name, with its live counts
  - availability:   the system-wide picture — bikes, docks, full and empty stations
  - ride-pair:      a whole ride: a station with a bike here, a station with a dock there

Every free answer is gated on the feed's own `is_renting` / `is_returning` flags, so a
station holding bikes nobody may take is reported as out of service rather than as
stock. The premium skill pairs the two halves of a ride on the gateway.
"""

from __future__ import annotations

import re

from a2a_kit import SkillAgent

from data import (
    DATASET,
    DEFAULT_SEARCH_KM,
    INFORMATION_TTL,
    MAX_STATIONS,
    NEAR_RADIUS_KM,
    PRODUCT,
    SOURCE,
    STATUS_TTL,
    BikeShareClient,
    UpstreamError,
)

SKILL_BIKES_NEAR = "bikes-near"
SKILL_NEAREST_STATIONS = "nearest-stations"
SKILL_STATION_LOOKUP = "station-lookup"
SKILL_AVAILABILITY = "availability"
SKILL_RIDE_PAIR = "ride-pair"

MAX_LISTED = 12

CARD_SKILLS = [
    {
        "id": SKILL_BIKES_NEAR,
        "name": "Bikes and docks near a point",
        "description": (
            "The stations around a latitude/longitude point with their live counts — bikes free, "
            "e-bikes, docks free to return to — closest first, each with its real distance and whether "
            "it is actually renting and returning right now."
        ),
        "tags": ["bikeshare", "citi-bike", "bikes", "nearby", "docks"],
        "examples": [
            "where can I get a bike near 40.7484,-73.9857?",
            "bikes and docks near Times Square",
            '{"skill": "bikes-near", "point": "40.7484,-73.9857", "limit": 5}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_NEAREST_STATIONS,
        "name": "Stations closest to a point",
        "description": (
            "The nearest Citi Bike stations to a point by real distance, whether or not they have "
            "anything free — the honest view of what is physically close, including stations that are "
            "full, empty or out of service."
        ),
        "tags": ["bikeshare", "citi-bike", "stations", "nearby", "distance"],
        "examples": [
            "which bike stations are closest to 40.7580,-73.9855?",
            "nearest dock to 40.7008,-73.9938",
            '{"skill": "nearest-stations", "point": "40.7580,-73.9855", "limit": 8}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_STATION_LOOKUP,
        "name": "Look up a station",
        "description": (
            "One station's live state by id, short name, or name — bikes, e-bikes, free docks, disabled "
            "bikes and docks, and the feed's own renting and returning flags."
        ),
        "tags": ["bikeshare", "citi-bike", "station", "lookup", "status"],
        "examples": [
            "what is at Broadway & W 48 St?",
            "how many bikes at station 6322.01?",
            '{"skill": "station-lookup", "station": "E 33 St & 5 Ave"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_AVAILABILITY,
        "name": "System-wide availability",
        "description": (
            "Citi Bike right now across the whole system: total bikes and e-bikes free, total free "
            "docks, how many stations are renting or returning, how many are full or empty, and how "
            "old the feed is."
        ),
        "tags": ["bikeshare", "citi-bike", "availability", "network", "totals"],
        "examples": [
            "how many bikes are there right now?",
            "is the bike system healthy?",
            '{"skill": "availability"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_RIDE_PAIR,
        "name": "Plan a ride end to end",
        "description": (
            "A whole ride answered at once: the nearest station to your start point that has a bike "
            "free and is renting, the nearest station to your destination that has a free dock and is "
            "accepting returns, both walking distances, and the runner-up pairs. Premium: it runs "
            "on a hosted service that was removed."
        ),
        "tags": ["bikeshare", "citi-bike", "ride", "plan", "route",],
        "examples": [
            "can I bike from 40.7484,-73.9857 to 40.7580,-73.9855?",
            "where do I pick up and drop off for that trip?",
            '{"skill": "ride-pair", "origin": "40.7484,-73.9857", "destination": "40.7580,-73.9855"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
]

_POINT_RE = re.compile(r"\b(-?\d{1,2}(?:\.\d+)?,\s?-?\d{1,3}(?:\.\d+)?)\b")
_PAIR_RE = re.compile(
    r"\b(-?\d{1,2}(?:\.\d+)?,\s?-?\d{1,3}(?:\.\d+)?)\s*(?:\b(?:to|and|→|->|until|toward|towards)\b|[→-]>?)\s*"
    r"(-?\d{1,2}(?:\.\d+)?,\s?-?\d{1,3}(?:\.\d+)?)"
)
#: Two points in one question only mean a ride when something moves between them: a
#: bike verb, or pickup-and-dropoff phrasing. "bikes and docks near X" has one point
#: and no verb, so it stays a free question.
_TRAVEL_WORDS = re.compile(
    r"\b(?:bike|bikes|biking|ride|rides|riding|cycle|cycles|cycling|scooter|scooters|"
    r"trip|journey|commute|pedal|pick ?up|dropoff)\b",
    re.IGNORECASE,
)
_PAIR_WORDS = re.compile(
    r"\b(?:drop|pick up|pickup|drop off|dropoff|return)\b.{0,30}\b(?:off|at|to)\b|"
    r"\bwhere (?:do|should) i\b.{0,30}\b(?:pick up|drop|return)\b",
    re.IGNORECASE,
)
_STATION_LOOKUP_WORDS = re.compile(
    r"\b(?:at|what(?:'s| is)|how many|status of|check|look up)\b[^.?]{0,40}\b"
    r"(?:station|dock|bikes?)\b|"
    r"\bhow many bikes at\b|\bwhat is at\b",
    re.IGNORECASE,
)
_NEEDS_BIKE_WORDS = re.compile(
    r"\b(?:where can i (?:get|pick up|grab)|get a bike|pick ?up a bike|find a bike|"
    r"bikes?\b[^.?]{0,20}\b(?:near|around|close to|by here)|need a bike|borrow a bike|"
    r"take a bike)\b",
    re.IGNORECASE,
)
_NEAREST_WORDS = re.compile(
    r"\b(?:nearest|closest|closest to|near(?:by|est)?|around|close to|"
    r"stations? (?:near|close|around|by))\b",
    re.IGNORECASE,
)
_SYSTEM_WORDS = re.compile(
    r"\b(?:how many (?:bikes|docks|ebikes|e-bikes|stations)\b|system[- ]wide|across the (?:city|system)|"
    r"whole (?:system|city|network)|whole city|"
    r"is the (?:bike|bikeshare)(?:\s+share)?(?:\s+system)? (?:healthy|working|ok|up)|"
    r"bike (?:health|status) system|any bikes anywhere|total bikes)\b",
    re.IGNORECASE,
)
_LIMIT_RE = re.compile(r"\b(?:top\s+|next\s+|first\s+|closest\s+)?(\d{1,2})\b(?=\s+(?:bikes?|stations?|docks?))", re.IGNORECASE)
_NAME_AFTER = re.compile(
    r"\b(?:at|station)\s+([A-Z0-9][A-Za-z0-9 .,'’&/()\-]{2,60})"
)
_STATION_ID_RE = re.compile(r"\b([0-9]{4}\.[0-9]{2,4})\b")

HELP = (
    "I read Citi Bike's live GBFS feeds: station status and station information for every dock in "
    "the system. Ask me:\n"
    "  • where can I get a bike near 40.7484,-73.9857?\n"
    "  • which bike stations are closest to 40.7580,-73.9855?\n"
    "  • what is at Broadway & W 48 St?\n"
    "  • how many bikes are there right now?\n"
    "  • can I bike from 40.7484,-73.9857 to 40.7580,-73.9855? (not implemented here)\n"
    "Counts are the feed's own and move every few seconds. A station that holds bikes but is not "
    "renting is reported as out of service, not as stock."
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
        if name in params:
            if params[name] not in (None, ""):
                return params[name]
    return default


def point_from_text(text: str) -> str | None:
    match = _POINT_RE.search(text)
    if not match:
        return None
    return re.sub(r"\s+", "", match.group(1))


def station_name_from_text(text: str) -> str | None:
    """A station name the question offers, never the whole question."""
    match = _STATION_ID_RE.search(text)
    if match:
        return match.group(1)
    match = _NAME_AFTER.search(text)
    if not match:
        return None
    candidate = match.group(1).strip(" .,'’")
    candidate = re.split(r"\s+(?:right now|today|have|has|is|are|can|i|to|with)\b", candidate)[0]
    if len(candidate) < 3 or len(candidate) > 60:
        return None
    return candidate


def parse(message: dict) -> dict:
    """Incoming message -> {skill, params, explicit}. Never raises."""
    text = message_text(message)
    data = message_data(message)
    requested = _first(data, "skill", "skill_id")

    origin = _first(data, "origin", "from", "origin_point", "start")
    destination = _first(data, "destination", "to", "destination_point", "end")
    if origin is None or destination is None:
        pair = _PAIR_RE.search(text)
        if pair:
            origin = re.sub(r"\s+", "", pair.group(1))
            destination = re.sub(r"\s+", "", pair.group(2))
    point = _first(data, "point", "lat_lon")
    if point is None:
        point = point_from_text(text)
    station = _first(data, "station", "station_id", "name", "station_name")
    if station is None:
        station = station_name_from_text(text)
    limit = _first(data, "limit")
    if limit is None:
        match = _LIMIT_RE.search(text)
        if match:
            limit = match.group(1)
    search_km = _first(data, "search_km", "radius_km", "radius")

    asked_for_pair = (bool(_PAIR_RE.search(text))
                        and bool(_TRAVEL_WORDS.search(text) or _PAIR_WORDS.search(text)))
    asked_for_system = bool(_SYSTEM_WORDS.search(text))
    asked_for_need = bool(_NEEDS_BIKE_WORDS.search(text))
    asked_for_nearest = bool(_NEAREST_WORDS.search(text))
    asked_for_lookup = bool(_STATION_LOOKUP_WORDS.search(text))

    if requested in (SKILL_BIKES_NEAR, SKILL_NEAREST_STATIONS, SKILL_STATION_LOOKUP,
                     SKILL_AVAILABILITY, SKILL_RIDE_PAIR):
        skill = requested
    elif asked_for_pair:
        skill = SKILL_RIDE_PAIR
    elif asked_for_lookup and station:
        skill = SKILL_STATION_LOOKUP
    elif asked_for_system:
        skill = SKILL_AVAILABILITY
    elif asked_for_need:
        skill = SKILL_BIKES_NEAR
    elif asked_for_nearest and point:
        skill = SKILL_NEAREST_STATIONS
    elif _TRAVEL_WORDS.search(text) and not point and not station:
        # A bike question with no location anywhere in it needs one, not the
        # system-wide answer, which is the wrong question rather than a bad input.
        skill = SKILL_BIKES_NEAR
    else:
        skill = SKILL_AVAILABILITY

    params: dict = {}
    for key, value in (("origin", origin), ("destination", destination), ("point", point),
                       ("station", station), ("limit", limit), ("search_km", search_km)):
        if value is not None:
            params[key] = value
    if skill in (SKILL_BIKES_NEAR, SKILL_NEAREST_STATIONS):
        params.setdefault("limit", MAX_LISTED)
    if skill == SKILL_RIDE_PAIR:
        params.setdefault("search_km", DEFAULT_SEARCH_KM)
    if not requested and (not text.strip() or re.search(r"\b(help|what can you do|commands?)\b", text, re.IGNORECASE)):
        skill, params = "help", {}
    explicit = bool(requested or asked_for_pair or asked_for_system or asked_for_need
                    or asked_for_lookup or asked_for_nearest)
    return {"skill": skill, "params": params, "explicit": explicit}


# -- shared shape ---------------------------------------------------------


def _artifact(params: dict, client: BikeShareClient, **extra) -> dict:
    artifact = {
        "dataset": DATASET,
        "product": PRODUCT,
        "source": SOURCE,
        "freshness": client.freshness(),
    }
    artifact.update(extra)
    return artifact


def _missing(skill: str) -> dict:
    if skill == SKILL_STATION_LOOKUP:
        message = (
            "Which station? Give me the name as Citi Bike writes it — Broadway & W 48 St — or the "
            "short name such as 6708.04, or the station id."
        )
    elif skill == SKILL_RIDE_PAIR:
        message = (
            "Where from and where to? Give me two points as 'lat,lon' — for example "
            "40.7484,-73.9857 to 40.7580,-73.9855 — and I will pair a pickup with a drop-off."
        )
    else:
        message = (
            "Which point? Give me a latitude/longitude such as 40.7484,-73.9857 and I will look "
            "around it."
        )
    return {"final_state": "input-required", "message": message, "artifact": None, "watch": None}


def _station_line(station: dict) -> str:
    head = f"  • {station.get('name') or 'name not reported'}"
    if station.get("short_name"):
        head += f" ({station['short_name']})"
    if "distance_km" in station:
        head += f" — {station['distance_km']} km away"
    counts = (f"{station['bikes_available']} bike(s)"
              + (f" ({station['ebikes_available']} e-bike)" if station["ebikes_available"] else "")
              + f", {station['docks_available']} free dock(s)")
    if station["docks_disabled"]:
        counts += f", {station['docks_disabled']} dock(s) disabled"
    if station["bikes_disabled"]:
        counts += f", {station['bikes_disabled']} bike(s) disabled"
    return f"{head}  {counts} — {BikeShareClient.service_note(station)}"


def _feed_age_text(age) -> str:
    if age is None:
        return "the feed does not say how old it is"
    if age < 120:
        return f"the feed was written {age} s ago"
    return f"the feed was written {round(age / 60)} min ago"


# -- skills ---------------------------------------------------------------


def run_bikes_near(params: dict, client: BikeShareClient) -> dict:
    lat, lon = client.check_point(params["point"])
    radius = client.check_search_km(params.get("search_km", NEAR_RADIUS_KM))
    rows = client.nearby(f"{lat},{lon}", limit=params.get("limit", MAX_LISTED), radius_km=radius)
    usable = [row for row in rows if row["renting"] and row["bikes_available"] > 0]
    artifact = _artifact(params, client, point=f"{lat},{lon}", stations=rows, count=len(rows),
                         usable_count=len(usable))
    if not rows:
        return {
            "final_state": "completed",
            "message": (
                f"Citi Bike publishes no station within {radius} km of {lat},{lon}. (Read live "
                f"from {DATASET}.)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    listing = "\n".join(_station_line(station) for station in rows[:MAX_LISTED])
    lead = (f"{len(usable)} of the {len(rows)} Citi Bike station(s) within {radius} km of {lat},{lon} "
            f"have a bike free and are renting:")
    if not usable:
        lead = (f"None of the {len(rows)} Citi Bike station(s) within {radius} km of {lat},{lon} has a "
                f"bike free and is renting. Closest anyway:")
    return {
        "final_state": "completed",
        "message": (
            f"{lead}\n{listing}\nDistances are straight-line. {_feed_age_text(rows[0]['feed_age_seconds'])}. "
            f"Source: {DATASET} (read live)."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_nearest_stations(params: dict, client: BikeShareClient) -> dict:
    lat, lon = client.check_point(params["point"])
    radius = client.check_search_km(params.get("search_km", NEAR_RADIUS_KM))
    rows = client.nearby(f"{lat},{lon}", limit=params.get("limit", MAX_LISTED), radius_km=radius)
    artifact = _artifact(params, client, point=f"{lat},{lon}", stations=rows, count=len(rows))
    if not rows:
        return {
            "final_state": "completed",
            "message": (
                f"Citi Bike publishes no station within {radius} km of {lat},{lon} — that is outside "
                f"the service area rather than a quiet corner. (Read live from {DATASET}.)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    listing = "\n".join(_station_line(station) for station in rows[:MAX_LISTED])
    return {
        "final_state": "completed",
        "message": (
            f"{len(rows)} Citi Bike station(s) nearest {lat},{lon} within {radius} km, whatever "
            f"their state:\n{listing}\nDistances are straight-line. Source: {DATASET} (read live)."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_station_lookup(params: dict, client: BikeShareClient) -> dict:
    # A lookup is asked for by name as often as by id, so the string goes straight
    # to the finder, which tries the id, the short name and the name in that order.
    wanted = str(params["station"]).strip()
    if not wanted or len(wanted) > 80:
        return {
            "final_state": "input-required",
            "message": "Give me the station name, its short name such as 6708.04, or its station id.",
            "artifact": None,
            "watch": None,
        }
    found = client.find_station(wanted)
    artifact = _artifact(params, client, station=wanted, found=found)
    if found is None:
        candidates = client.search(name=wanted, limit=5)
        if candidates:
            listing = "\n".join(f"  • {row.get('name')}" for row in candidates)
            return {
                "final_state": "input-required",
                "message": f"“{wanted}” matches more than one Citi Bike station. Which one?\n{listing}",
                "artifact": {**artifact, "candidates": candidates},
                "watch": None,
            }
        return {
            "final_state": "completed",
            "message": (
                f"No Citi Bike station matches “{wanted}”. Give the name as Citi Bike writes it, the "
                f"short name such as 6708.04, or a point and I will list what is nearest."
            ),
            "artifact": artifact,
            "watch": None,
        }
    artifact = {**artifact, "station_found": found}
    note = BikeShareClient.service_note(found)
    return {
        "final_state": "completed",
        "message": (
            f"{found.get('name')}"
            + (f" ({found['short_name']})" if found.get("short_name") else "")
            + f": {found['bikes_available']} bike(s) free"
            + (f", {found['ebikes_available']} of them e-bikes" if found["ebikes_available"] else "")
            + f", {found['docks_available']} free dock(s) to return to"
            + (f", {found['docks_disabled']} dock(s) disabled" if found["docks_disabled"] else "")
            + f" — {note}."
            + f" {_feed_age_text(found['feed_age_seconds']).capitalize()}. Source: {DATASET} (read live)."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_availability(params: dict, client: BikeShareClient) -> dict:
    totals = client.system_totals()
    artifact = _artifact(params, client, totals=totals)
    return {
        "final_state": "completed",
        "message": (
            f"Citi Bike right now, across all {totals['stations']} station(s):\n"
            f"  • {totals['bikes_available']} bike(s) free, {totals['ebikes_available']} of them e-bikes; "
            f"{totals['docks_available']} dock(s) free to return to.\n"
            f"  • {totals['renting']} station(s) renting, {totals['returning']} accepting returns, "
            f"{totals['out_of_service']} out of service.\n"
            f"  • {totals['full_stations']} station(s) with no free dock to return to, "
            f"{totals['empty_stations']} with no bike to take.\n"
            f"  • {_feed_age_text(totals['feed_age_seconds'])}. Source: {DATASET} (read live)."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_ride_pair(params: dict, client: BikeShareClient, gateway: object) -> dict:
    """Stub: the hosted implementation of this skill was removed in the paywall cleanup."""
    return {
        "final_state": "completed",
        "message": 'Not yet implemented: ride-pair — its hosted implementation was removed.',
        "artifact": {"removed": True},
        "watch": None,
    }


class BikeShareAgent(SkillAgent):
    name = "bikeshare"
    card_name = "Citi Bike Station Agent"
    card_description = (
        "Read-only agent over Citi Bike's GBFS feeds: live bike and dock counts for every station in "
        "the system, the stations nearest any point, one station's full state by name or short name, "
        "and the system-wide totals — every answer gated on the feed's own renting and returning "
        "flags. One premium skill pairs a pickup with a drop-off for a whole ride, and it runs behind "
        "a licence check on the gateway."
    )
    env_prefix = "BIKESHARE"
    datasets = (DATASET,)
    card_skills = CARD_SKILLS

    def __init__(self, client: BikeShareClient | None = None, gateway: object | None = None) -> None:
        self.client = client or BikeShareClient()
        self.gateway = gateway

    def parse(self, message: dict) -> dict:
        return parse(message)

    def missing(self, skill: str, params: dict) -> list[str]:
        if skill == SKILL_STATION_LOOKUP:
            return [] if params.get("station") else ["station"]
        if skill == SKILL_RIDE_PAIR:
            has_both = all(params.get(key) for key in ("origin", "destination"))
            return [] if has_both else ["origin", "destination"]
        if skill in (SKILL_BIKES_NEAR, SKILL_NEAREST_STATIONS):
            return [] if params.get("point") else ["point"]
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
            if skill == SKILL_RIDE_PAIR:
                return run_ride_pair(params, self.client, self.gateway)
            if skill == SKILL_BIKES_NEAR:
                return run_bikes_near(params, self.client)
            if skill == SKILL_NEAREST_STATIONS:
                return run_nearest_stations(params, self.client)
            if skill == SKILL_STATION_LOOKUP:
                return run_station_lookup(params, self.client)
            if skill == SKILL_AVAILABILITY:
                return run_availability(params, self.client)
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
    "BikeShareAgent",
    "BikeShareClient",
    "SKILL_AVAILABILITY",
    "SKILL_BIKES_NEAR",
    "SKILL_NEAREST_STATIONS",
    "SKILL_RIDE_PAIR",
    "SKILL_STATION_LOOKUP",
    "UpstreamError",
    "message_data",
    "message_text",
    "parse",
    "run_availability",
    "run_bikes_near",
    "run_nearest_stations",
    "run_ride_pair",
    "run_station_lookup",
    "station_name_from_text",
]
