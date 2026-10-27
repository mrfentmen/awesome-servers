"""Read-only client for the Citi Bike GBFS feeds (gbfs.citibikenyc.com).

Endpoints (keyless, verified live 2026-09-28):
  - /gbfs/en/station_status.json        bikes, docks and service flags, per station
  - /gbfs/en/station_information.json   names, coordinates and capacity, per station

Four things about GBFS shape the client:

1. Status and information are separate documents that share `station_id`. Neither is
   useful alone, so `stations()` joins them and drops any station one side is missing.
2. Both documents are close to a megabyte each, and the status document is what changes
   every few seconds, so the join is cached for a short window and the location part
   for a day. Nothing here polls.
3. The status feed's own `is_installed`, `is_renting` and `is_returning` flags are not
   cosmetic: a station can hold bikes that cannot be taken, and docks that cannot be
   returned to. Every "is there a bike" answer is gated on them.
4. A dock count of zero with bikes present is a full station, not a broken one, and a
   station the operator has taken out of service still reports its last numbers. Both
   are reported as they stand rather than smoothed away.
"""

from __future__ import annotations

import math
import os
import re
from datetime import datetime, timezone

from a2a_kit import JsonApiClient, UpstreamError, utc_now_iso

BASE_URL = "https://gbfs.citibikenyc.com/gbfs/en"
STATUS_PATH = "/station_status.json"
INFORMATION_PATH = "/station_information.json"

DATASET = "gbfs.citibikenyc.com"
PRODUCT = "Citi Bike station status and station information (GBFS)"
SOURCE = "Citi Bike / Lyft"

#: The status document refreshes every few seconds; 30s is fresh without hammering.
STATUS_TTL = 30.0
#: Names, coordinates and capacity change a few times a year.
INFORMATION_TTL = 86400.0

MAX_STATIONS = 25
#: The premium pairing looks this far round each end. The free "near me" skills look
#: twice as far, because a rider will walk a little further than a pairing does.
DEFAULT_SEARCH_KM = 1.0
NEAR_RADIUS_KM = 2.0

#: GBFS station ids are UUID-shaped or a legacy digit string; names are street corners.
_ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.:-]{0,60}$")
_NAME_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9 .,'’&/()\-]{1,80}$")
_POINT_RE = re.compile(r"^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$")

INFO_FIELDS = ("name", "short_name", "region_id", "capacity", "has_kiosk", "station_type")
STATUS_FIELDS = ("num_bikes_available", "num_ebikes_available", "num_docks_available",
                 "num_docks_disabled", "num_bikes_disabled", "is_installed", "is_renting",
                 "is_returning", "last_reported")

__all__ = [
    "BASE_URL",
    "DATASET",
    "DEFAULT_SEARCH_KM",
    "INFORMATION_PATH",
    "INFORMATION_TTL",
    "INFO_FIELDS",
    "MAX_STATIONS",
    "NEAR_RADIUS_KM",
    "PRODUCT",
    "SOURCE",
    "STATUS_PATH",
    "STATUS_TTL",
    "BikeShareClient",
    "UpstreamError",
    "haversine_km",
    "relative_seconds",
]


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in kilometres."""
    radius = 6371.0088
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    return 2 * radius * math.asin(math.sqrt(a))


def relative_seconds(epoch_seconds) -> int | None:
    """How long ago the feed says it updated, in seconds."""
    if epoch_seconds in (None, ""):
        return None
    try:
        stamp = float(epoch_seconds)
    except (TypeError, ValueError):
        return None
    if stamp > 1e11:  # milliseconds, in case the feed ever switches
        stamp /= 1000.0
    return int(datetime.now(timezone.utc).timestamp() - stamp)


class BikeShareClient(JsonApiClient):
    env_prefix = "BIKESHARE"
    base_url = BASE_URL

    def __init__(self, fetch=None, base_url=None, cache_ttl=None, timeout=None, headers=None) -> None:
        super().__init__(fetch=fetch, base_url=base_url, cache_ttl=cache_ttl, timeout=timeout, headers=headers)
        self.status_ttl = float(os.environ.get(f"{self.env_prefix}_STATUS_TTL", STATUS_TTL))
        self.information_ttl = float(os.environ.get(f"{self.env_prefix}_INFORMATION_TTL", INFORMATION_TTL))

    # -- validation --------------------------------------------------------

    @staticmethod
    def check_station(value) -> str:
        station = str(value).strip()
        if not _ID_RE.match(station):
            raise ValueError("a station id is the id Citi Bike publishes, such as 66dc840f-0aca-11e7-82f6-3863bb44ef7c")
        return station

    @staticmethod
    def check_name(value) -> str:
        name = str(value).strip()
        if not _NAME_RE.match(name):
            raise ValueError("that does not look like a Citi Bike station name")
        return name

    @staticmethod
    def check_point(point) -> tuple[float, float]:
        match = _POINT_RE.match(str(point))
        if not match:
            raise ValueError("a point is 'lat,lon', for example 40.7484,-73.9857")
        lat, lon = float(match.group(1)), float(match.group(2))
        if not -90 <= lat <= 90 or not -180 <= lon <= 180:
            raise ValueError("latitude must be -90..90 and longitude -180..180")
        return round(lat, 5), round(lon, 5)

    @staticmethod
    def check_search_km(value) -> float:
        try:
            radius = float(value)
        except (TypeError, ValueError):
            raise ValueError("search_km must be a number of kilometres") from None
        if not 0.1 <= radius <= 5:
            raise ValueError("search_km must be between 0.1 and 5 km")
        return round(radius, 2)

    @staticmethod
    def check_limit(value, maximum: int = MAX_STATIONS) -> int:
        try:
            limit = int(value)
        except (TypeError, ValueError):
            raise ValueError("limit must be a whole number") from None
        if not 1 <= limit <= maximum:
            raise ValueError(f"limit must be between 1 and {maximum}")
        return limit

    # -- transport ---------------------------------------------------------

    @staticmethod
    def _flag(value) -> bool:
        """GBFS service flags are 0 or 1; anything else counts as not available."""
        return value == 1

    def stations(self) -> list[dict]:
        """Every station, status and information joined on `station_id`.

        Both documents are read: the status one is cached for seconds, the location
        one for a day, so a second question costs one small read at most.
        """
        status_payload = self.get_json(STATUS_PATH, {}, ttl=min(self.status_ttl, self.cache_ttl))
        info_payload = self.get_json(INFORMATION_PATH, {}, ttl=min(self.information_ttl, self.cache_ttl))
        if not isinstance(status_payload, dict) or not isinstance(info_payload, dict):
            raise UpstreamError("Citi Bike returned an unexpected GBFS payload")
        status_rows = (status_payload.get("data") or {}).get("stations")
        info_rows = (info_payload.get("data") or {}).get("stations")
        if status_rows is None or info_rows is None:
            raise UpstreamError("Citi Bike returned a GBFS document with no station list")
        status_by_id = {str(row.get("station_id")): row for row in status_rows if row.get("station_id")}

        stations = []
        for row in info_rows:
            station_id = str(row.get("station_id") or "")
            status = status_by_id.get(station_id)
            if not station_id or status is None:
                continue
            latitude, longitude = _to_float(row.get("lat")), _to_float(row.get("lon"))
            if latitude is None or longitude is None:
                continue
            bikes = _to_int(status.get("num_bikes_available")) or 0
            ebikes = _to_int(status.get("num_ebikes_available")) or 0
            stations.append({
                "station_id": station_id,
                **self.pick(row, INFO_FIELDS),
                "latitude": latitude,
                "longitude": longitude,
                "bikes_available": bikes,
                "ebikes_available": ebikes,
                "docks_available": _to_int(status.get("num_docks_available")) or 0,
                "docks_disabled": _to_int(status.get("num_docks_disabled")) or 0,
                "bikes_disabled": _to_int(status.get("num_bikes_disabled")) or 0,
                "installed": self._flag(status.get("is_installed")),
                "renting": self._flag(status.get("is_renting")),
                "returning": self._flag(status.get("is_returning")),
                "last_reported": _to_int(status.get("last_reported")),
                "feed_age_seconds": relative_seconds(status_payload.get("last_updated")),
            })
        if not stations:
            raise UpstreamError("Citi Bike published no station with both a name and a position")
        return stations

    def feed_age(self) -> int | None:
        """How many seconds ago the status document says it was written."""
        payload = self.get_json(STATUS_PATH, {}, ttl=min(self.status_ttl, self.cache_ttl))
        if not isinstance(payload, dict):
            return None
        return relative_seconds(payload.get("last_updated"))

    def nearby(self, point: str, limit: int = 10, radius_km: float = DEFAULT_SEARCH_KM) -> list[dict]:
        """Stations closest to a point, whatever their state."""
        lat, lon = self.check_point(point)
        limit = self.check_limit(limit)
        radius = self.check_search_km(radius_km)
        rows = []
        for station in self.stations():
            distance = round(haversine_km(lat, lon, station["latitude"], station["longitude"]), 3)
            if distance <= radius:
                rows.append({**station, "distance_km": distance})
        rows.sort(key=lambda row: row["distance_km"])
        return rows[:limit]

    def find_station(self, wanted: str) -> dict | None:
        """One station by its exact id, its short name, or an unambiguous part of its name."""
        needle = str(wanted or "").strip()
        if not needle:
            return None
        stations = self.stations()
        for station in stations:
            if station["station_id"] == needle:
                return station
        short = needle.lower()
        for station in stations:
            if (station.get("short_name") or "").lower() == short:
                return station
        exact = [station for station in stations if (station.get("name") or "").lower() == needle.lower()]
        if len(exact) == 1:
            return exact[0]
        partial = [station for station in stations if needle.lower() in (station.get("name") or "").lower()]
        if len(partial) == 1:
            return partial[0]
        return None

    def search(self, name: str | None = None, point: str | None = None, limit: int = 10) -> list[dict]:
        """Stations by name substring, or the nearest to a point."""
        limit = self.check_limit(limit)
        if point:
            return self.nearby(point, limit=limit, radius_km=DEFAULT_SEARCH_KM * 2)
        needle = self.check_name(name).lower()
        matches = [station for station in self.stations() if needle in (station.get("name") or "").lower()]
        matches.sort(key=lambda station: (station.get("name") or ""))
        return matches[:limit]

    def system_totals(self) -> dict:
        """What the whole system looks like right now, in the feed's own numbers."""
        stations = self.stations()
        working = [station for station in stations if station["installed"]]
        renting = [station for station in working if station["renting"]]
        returning = [station for station in working if station["returning"]]
        # A "full" station is one you cannot return a bike to; an "empty" one is one
        # with no bike to take. Both are the feed's own counts, not an estimate.
        full = [station for station in returning if station["docks_available"] == 0]
        empty = [station for station in renting if station["bikes_available"] == 0]
        ages = [station["feed_age_seconds"] for station in stations if station["feed_age_seconds"] is not None]
        return {
            "stations": len(stations),
            "installed": len(working),
            "renting": len(renting),
            "returning": len(returning),
            "out_of_service": len(stations) - len(working),
            "bikes_available": sum(station["bikes_available"] for station in stations),
            "ebikes_available": sum(station["ebikes_available"] for station in stations),
            "docks_available": sum(station["docks_available"] for station in stations),
            "docks_disabled": sum(station["docks_disabled"] for station in stations),
            "full_stations": len(full),
            "empty_stations": len(empty),
            "feed_age_seconds": max(ages) if ages else None,
        }

    @staticmethod
    def service_note(station: dict) -> str:
        """The one line that says whether a station can actually be used."""
        if not station["installed"]:
            return "out of service"
        if station["bikes_available"] == 0:
            return "no bikes free" + ("" if station["renting"] else ", not renting")
        if station["docks_available"] == 0:
            return "full: no free dock to return to"
        if not station["renting"]:
            return "not renting"
        if not station["returning"]:
            return "not accepting returns"
        return "in service"

    @staticmethod
    def freshness() -> str:
        """The status feed is live, so freshness is the moment we read it."""
        return utc_now_iso()


def _to_float(value) -> float | None:
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _to_int(value) -> int | None:
    if value in (None, ""):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None
