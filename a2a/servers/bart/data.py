"""Read-only client for the BART public API (api.bart.gov).

Endpoints (verified live 2026-09-28):
  - /api/etd.aspx?cmd=etd&orig=<abbr>   real-time departure estimates for a station
  - /api/stn.aspx?cmd=stns              every station (50 of them)

Four things about this API shape the client:

1. BART's API is XML first, so every call carries `json=y` and comes back as
   `{"?xml": ..., "root": {...}}` — the payload is wrapped twice before the data.
2. `root.message` is the failure channel: an empty string on success, or
   `{"error": {"text", "details"}}` on failure, always alongside the HTTP status.
3. Only `cmd=etd` and `cmd=stns` answer. `cmd=stn` is a 400 and `cmd=fare` is a
   500 from BART's own server, so there is no fare lookup here to offer.
4. `estimate.minutes` counts from BART's own clock, which the payload also hands
   back as `root.date` + `root.time`, so no offset maths is needed anywhere.

The key: BART publishes one demo key in its own API reference for exactly this
kind of read. It is used here as a default and can be replaced with
`BART_API_KEY`; no other key is ever assumed.
"""

from __future__ import annotations

import os
import re

from a2a_kit import JsonApiClient, UpstreamError, utc_now_iso

BASE_URL = "https://api.bart.gov/api"

ETD_PATH = "/etd.aspx"
STNS_PATH = "/stn.aspx"

DATASET = "api.bart.gov"
PRODUCT = "BART real-time departure estimates and station directory"
SOURCE = "Bay Area Rapid Transit"

#: BART's own published demo key, from its public API reference. Override with
#: BART_API_KEY to use a key of your own; nothing else is ever assumed.
DEMO_KEY = "MW9S-E7SL-26DU-VV8V"

#: The board moves every minute; the station directory changes a few times a year.
LIVE_TTL = 60.0
DIRECTORY_TTL = 86400.0

MAX_DEPARTURES = 30
MAX_STATIONS = 25

#: BART abbreviations are three or four letters and digits, such as EMBR or PITT.
_ABBR_RE = re.compile(r"^[A-Z0-9]{3,4}$")
_NAME_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9 .,'’\-/()]{1,60}$")

STATION_FIELDS = ("name", "abbr", "address", "city", "county", "state", "zipcode",
                  "gtfs_latitude", "gtfs_longitude")

#: The flags BART puts on every estimate, in the wording BART itself uses.
FLAG_WORDS = {
    "1": "yes",
    "0": "no",
    "": "not reported",
}

__all__ = [
    "BASE_URL",
    "DATASET",
    "DEMO_KEY",
    "DIRECTORY_TTL",
    "ETD_PATH",
    "FLAG_WORDS",
    "LIVE_TTL",
    "MAX_DEPARTURES",
    "MAX_STATIONS",
    "PRODUCT",
    "SOURCE",
    "STNS_PATH",
    "STATION_FIELDS",
    "BartClient",
    "UpstreamError",
    "flag",
    "matches_direction",
]


def flag(value) -> str | None:
    """BART's own 0/1 flags, read as the words they mean."""
    if value is None:
        return None
    text = str(value).strip()
    if text in FLAG_WORDS:
        return FLAG_WORDS[text]
    return text


def _city_matches(city: str | None, wanted: str) -> bool:
    """Does a station's published city match the city the caller named?

    Matched from the front rather than as a substring, so "San Francisco" reaches
    "San Francisco" and "San Francisco Int'l Airport" but not "South San Francisco".
    """
    if not city:
        return False
    lowered = city.lower()
    if lowered == wanted:
        return True
    if lowered.startswith(wanted):
        rest = lowered[len(wanted):]
        return bool(rest) and not rest[0].isalpha()
    return False


def matches_direction(departure: dict, wanted: str) -> bool:
    """Does a destination row serve the direction the caller asked for?

    Matched on the destination name, its abbreviation, and the per-train direction
    BART publishes, so "north", "Northbound", "n", "ANTC" and "Antioch" all work.
    """
    needle = str(wanted).strip().lower()
    if not needle:
        return True
    destinations = [str(departure.get("destination") or "").lower()]
    abbreviation = str(departure.get("abbreviation") or "").lower()
    directions = {str(row.get("direction") or "").lower() for row in departure.get("estimates") or []}
    directions |= {value[:1] for value in list(directions) if value}
    if any(needle in value for value in destinations if value):
        return True
    if abbreviation and (needle == abbreviation or abbreviation.startswith(needle)):
        return True
    return any(needle == value or value.startswith(needle) for value in directions if value)


def to_int(value) -> int | None:
    if value in (None, ""):
        return None
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


class BartClient(JsonApiClient):
    env_prefix = "BART"
    base_url = BASE_URL

    def __init__(self, fetch=None, base_url=None, cache_ttl=None, timeout=None, headers=None) -> None:
        super().__init__(fetch=fetch, base_url=base_url, cache_ttl=cache_ttl, timeout=timeout, headers=headers)
        self.api_key = os.environ.get(f"{self.env_prefix}_API_KEY", DEMO_KEY).strip() or DEMO_KEY
        self.live_ttl = float(os.environ.get(f"{self.env_prefix}_LIVE_TTL", LIVE_TTL))
        self.directory_ttl = float(os.environ.get(f"{self.env_prefix}_DIRECTORY_TTL", DIRECTORY_TTL))

    # -- validation --------------------------------------------------------

    @staticmethod
    def check_abbr(value) -> str:
        """A BART station abbreviation: EMBR, PITT, MLBR, 12TH."""
        abbr = str(value).strip().upper()
        if not _ABBR_RE.match(abbr):
            raise ValueError(
                "a BART station is its three or four letter abbreviation, such as EMBR, PITT or MLBR"
            )
        return abbr

    @staticmethod
    def check_name(value) -> str:
        name = str(value).strip()
        if not _NAME_RE.match(name):
            raise ValueError("that does not look like a BART station name")
        return name

    @staticmethod
    def check_direction(value) -> str | None:
        """A destination, as a name or an abbreviation. BART's own wording."""
        if value in (None, ""):
            return None
        direction = str(value).strip()
        if len(direction) > 60:
            raise ValueError("a destination is at most 60 characters, such as Antioch")
        return direction

    @staticmethod
    def check_minutes(value) -> int:
        try:
            minutes = int(value)
        except (TypeError, ValueError):
            raise ValueError("minutes must be a whole number") from None
        if not 0 <= minutes <= 240:
            raise ValueError("minutes must be between 0 and 240")
        return minutes

    @staticmethod
    def check_limit(value, maximum: int = MAX_DEPARTURES) -> int:
        try:
            limit = int(value)
        except (TypeError, ValueError):
            raise ValueError("limit must be a whole number") from None
        if not 1 <= limit <= maximum:
            raise ValueError(f"limit must be between 1 and {maximum}")
        return limit

    # -- transport ---------------------------------------------------------

    def _read(self, path: str, params: dict, ttl: float) -> dict:
        """One call, unwrapped from BART's `{"?xml", "root"}` envelope."""
        payload = self.get_json(path, params, ttl=ttl)
        if not isinstance(payload, dict):
            raise UpstreamError("BART returned an unexpected payload")
        root = payload.get("root")
        if not isinstance(root, dict):
            raise UpstreamError("BART returned an unexpected payload")
        # BART reports its own failures in the body, whatever the HTTP status.
        problem = root.get("message")
        if isinstance(problem, dict) and problem.get("error"):
            error = problem["error"] if isinstance(problem["error"], dict) else {}
            detail = error.get("details") or error.get("text") or "unknown error"
            raise UpstreamError(f"BART refused that request: {detail}")
        return root

    @staticmethod
    def _departure(row: dict) -> dict | None:
        """One `etd` row (a destination) with its estimates attached."""
        estimates = []
        for estimate in row.get("estimate") or []:
            minutes = to_int(estimate.get("minutes"))
            if minutes is None:
                continue
            estimates.append({
                "minutes": minutes,
                "platform": estimate.get("platform") or None,
                "direction": estimate.get("direction") or None,
                "line_colour": estimate.get("color") or None,
                "line_hex": estimate.get("hexcolor") or None,
                "length": to_int(estimate.get("length")),
                "bikes_allowed": flag(estimate.get("bikeflag")),
                "cancelled": flag(estimate.get("cancelflag")),
                "live_estimate": flag(estimate.get("dynamicflag")),
            })
        if not estimates:
            return None
        return {
            "destination": row.get("destination") or "destination not reported",
            "abbreviation": row.get("abbreviation") or None,
            "limited": flag(row.get("limited")),
            "estimates": estimates,
        }

    # -- reads -------------------------------------------------------------

    def board(self, station: str, direction: str | None = None) -> dict:
        """The live departure board at one station.

        BART only holds a few destinations per board and a few estimates per
        destination, so the board is the whole of what the agency publishes — the
        caller is told how much of it was read rather than being handed a thin list
        as if it were the timetable.
        """
        abbr = self.check_abbr(station)
        # BART's own `dir=n|s` filter drops a whole board rather than the one row you
        # asked for, so the whole board is read and the direction is applied below.
        params = {"cmd": "etd", "orig": abbr, "key": self.api_key, "json": "y"}
        root = self._read(ETD_PATH, params, ttl=min(self.live_ttl, self.cache_ttl))
        stations = root.get("station")
        stations = stations if isinstance(stations, list) else [stations]
        board = next((row for row in stations if isinstance(row, dict)), None)
        if board is None:
            return {
                "station": abbr,
                "name": None,
                "clock": {"date": root.get("date"), "time": root.get("time")},
                "departures": [],
                "destinations": [],
            }
        departures = []
        for row in board.get("etd") or []:
            departure = self._departure(row)
            if departure:
                departures.append(departure)
        if direction:
            departures = [departure for departure in departures if matches_direction(departure, direction)]
        departures.sort(key=lambda departure: departure["estimates"][0]["minutes"])
        return {
            "station": board.get("abbr") or abbr,
            "name": board.get("name") or None,
            "clock": {"date": root.get("date"), "time": root.get("time")},
            "departures": departures,
            "destinations": sorted({departure["destination"] for departure in departures}),
        }

    def board_rows(self, station: str, direction: str | None = None) -> list[dict]:
        """The board flattened to one row per train, soonest first."""
        rows = []
        for departure in self.board(station, direction=direction)["departures"]:
            for estimate in departure["estimates"]:
                rows.append({
                    "destination": departure["destination"],
                    "abbreviation": departure["abbreviation"],
                    "limited": departure["limited"],
                    **estimate,
                })
        rows.sort(key=lambda row: row["minutes"])
        return rows

    def station_list(self) -> list[dict]:
        """Every BART station, cached for a day so the searches cost nothing."""
        root = self._read(STNS_PATH, {"cmd": "stns", "key": self.api_key, "json": "y"},
                          ttl=min(self.directory_ttl, self.cache_ttl))
        stations = (root.get("stations") or {}).get("station")
        if stations is None:
            raise UpstreamError("BART returned an unexpected stations payload")
        if isinstance(stations, dict):
            stations = [stations]
        return [{"abbr": row.get("abbr"), **self.pick(row, STATION_FIELDS)} for row in stations]

    def find_station(self, wanted: str) -> dict | None:
        """A station by abbreviation, exact name, or a distinctive part of the name.

        The directory is small, so an abbreviation match wins outright and a name
        match needs to be unambiguous: two stations called "Dublin/Pleasanton" would
        otherwise silently pick one.
        """
        needle = str(wanted or "").strip()
        if not needle:
            return None
        stations = self.station_list()
        abbr = needle.upper()
        if _ABBR_RE.match(abbr):
            for station in stations:
                if (station.get("abbr") or "").upper() == abbr:
                    return station
        lowered = needle.lower()
        exact = [station for station in stations if (station.get("name") or "").lower() == lowered]
        if len(exact) == 1:
            return exact[0]
        partial = [station for station in stations if lowered in (station.get("name") or "").lower()]
        if len(partial) == 1:
            return partial[0]
        return None

    def find_stations(self, name: str | None = None, city: str | None = None,
                      limit: int = 10) -> list[dict]:
        """Stations matching a name and/or a city, name matches first."""
        limit = self.check_limit(limit, MAX_STATIONS)
        stations = self.station_list()
        wanted_name = self.check_name(name).lower() if name else None
        wanted_city = str(city).strip().lower() if city else None
        if wanted_name is None and wanted_city is None:
            return stations[:limit]
        matches = []
        for station in stations:
            if wanted_name and wanted_name not in (station.get("name") or "").lower():
                continue
            # A city is matched from the front, not as a substring: "San Francisco"
            # must not reach "South San Francisco".
            if wanted_city and not _city_matches(station.get("city"), wanted_city):
                continue
            matches.append(station)
        matches.sort(key=lambda station: (station.get("name") or ""))
        return matches[:limit]

    @staticmethod
    def clock_text(board: dict) -> str:
        """BART's own clock, which the board is relative to."""
        clock = board.get("clock") or {}
        if clock.get("date") and clock.get("time"):
            return f"{clock['date']} {clock['time']} BART time"
        return "BART time not reported"

    @staticmethod
    def freshness() -> str:
        """The board moves every minute, so freshness is the moment we read it."""
        return utc_now_iso()
