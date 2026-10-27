"""Read-only client for the radio-browser open internet-radio directory.

Endpoints (keyless, verified live 2026-09-28):
  - /json/stations/search           stations by name, countrycode, tag, position
  - /json/stations/byuuid/{uuid}   one station's full record
  - /json/tags/top                  the tags the directory indexes, with counts
  - /json/languages                 the languages it indexes, with counts

Four things about this API shape the client:

1. One endpoint does everything. `search` takes name, countrycode, tag, lat/lon,
   order, reverse, limit and hidebroken, so there is one read per question rather
   than one per filter. The client passes only the filters it was given.
2. Stations arrive with `lastcheckok` (1 or 0), `lastchecktime` and
   `lastcheckoktime`. A stream that failed its last check is reported as failed
   rather than hidden, because a directory full of dead streams is the normal state
   of an internet-radio directory.
3. `geo_distance` is only present when the request carried a position. A station
   without coordinates has no distance and gets none invented.
4. The mirrors throttle bursts. The client never loops over a list: a genre or a
   country is one read, and the roster skill that needs several reads is the one
   that runs on the gateway instead, where a rate limit costs one caller rather
   than every caller.

The mirror host is configurable (`RADIO_BROWSER_BASE_URL`) because radio-browser
publishes several and any of them can be slow.
"""

from __future__ import annotations

import math
import os
import re

from a2a_kit import JsonApiClient, UpstreamError, utc_now_iso

BASE_URL = "https://de1.api.radio-browser.info"

SEARCH_PATH = "/json/stations/search"
BYUUID_PATH = "/json/stations/byuuid/{uuid}"
TAGS_TOP_PATH = "/json/tags/top"
LANGUAGES_PATH = "/json/languages"

DATASET = "de1.api.radio-browser.info/json"
PRODUCT = "radio-browser open internet-radio directory"
SOURCE = "radio-browser (open internet radio directory)"

STATION_FIELDS = ("stationuuid", "name", "url", "url_resolved", "homepage", "favicon",
                  "country", "countrycode", "state", "language", "tags", "codec", "bitrate",
                  "hls", "lastcheckok", "lastchecktime", "lastcheckoktime", "clickcount",
                  "clicktrend", "votes", "geo_lat", "geo_long", "geo_distance")

#: Fields radio-browser keeps the same on every mirror, so an answer can name them.
ORDER_FIELDS = ("clickcount", "votes", "name", "bitrate", "lastchecktime", "random")

_UUID_RE = re.compile(r"^[0-9a-fA-F-]{8,40}$")
_COUNTRY_RE = re.compile(r"^[A-Za-z]{2}$")
_POINT_RE = re.compile(r"^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$")
_NAME_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9 .,'’/&\-_()!]{1,90}$")
#: A tag is a single lowercase word in radio-browser's own vocabulary.
_TAG_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9 &'+\-]{0,39}$")
#: The directory's most-used tags, used to tell a genre from a stray phrase.
KNOWN_TAGS = (
    "jazz", "rock", "pop", "classical", "electronic", "dance", "hip hop", "metal", "country",
    "blues", "reggae", "soul", "folk", "world", "news", "talk", "oldies", "ambient",
    "latin", "indie", "funk", "disco", "techno", "house", "chillout", "trance", "rnb",
)

__all__ = [
    "BASE_URL",
    "BYUUID_PATH",
    "DATASET",
    "KNOWN_TAGS",
    "LANGUAGES_PATH",
    "ORDER_FIELDS",
    "PRODUCT",
    "RadioBrowserClient",
    "haversine_km",
    "SEARCH_PATH",
    "SOURCE",
    "STATION_FIELDS",
    "TAGS_TOP_PATH",
    "UpstreamError",
    "station_health",
    "station_tags",
]


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in kilometres.

    The mirror does return `geo_lat`/`geo_long` for a station, but it does not fill in
    `geo_distance` for a positional search, so the distance a caller asks "near me" for
    is worked out here from the directory's own coordinates.
    """
    radius = 6371.0088
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    return 2 * radius * math.asin(math.sqrt(a))


def _to_float(value) -> float | None:
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _to_int(value) -> int | None:
    number = _to_float(value)
    return None if number is None else int(number)


def station_health(station: dict) -> str:
    """Whether the directory's last check found this stream working."""
    if _to_int(station.get("lastcheckok")) == 1:
        return "stream worked on the last check"
    if _to_int(station.get("lastcheckok")) == 0:
        return "stream failed the last check"
    return "last check not reported"


def station_tags(station: dict, limit: int = 12) -> list[str]:
    """radio-browser ships tags as one comma-separated string."""
    raw = station.get("tags")
    if not isinstance(raw, str):
        return []
    return [tag.strip() for tag in raw.split(",") if tag.strip()][:limit]


class RadioBrowserClient(JsonApiClient):
    env_prefix = "RADIO_BROWSER"
    base_url = BASE_URL
    #: A stream's health changes on the mirror's schedule, not by the second.
    default_ttl = 600.0

    def __init__(self, fetch=None, base_url=None, cache_ttl=None, timeout=None, headers=None) -> None:
        super().__init__(fetch=fetch, base_url=base_url, cache_ttl=cache_ttl, timeout=timeout, headers=headers)
        self.health_ttl = float(os.environ.get(f"{self.env_prefix}_HEALTH_TTL", "300"))

    # -- validation --------------------------------------------------------

    @staticmethod
    def check_name(value) -> str:
        name = str(value).strip()
        if not _NAME_RE.match(name):
            raise ValueError("that does not look like a station name")
        return name

    @staticmethod
    def check_uuid(value) -> str:
        station_uuid = str(value).strip()
        if not _UUID_RE.match(station_uuid):
            raise ValueError("a radio-browser station uuid looks like 8c1a1a1a-1111-2222-3333-444455556666")
        return station_uuid

    @staticmethod
    def check_country(value) -> str:
        code = str(value).strip().upper()
        if not _COUNTRY_RE.match(code):
            raise ValueError("a country is a two-letter code, for example US, GB or DE")
        return code

    @staticmethod
    def check_tag(value) -> str:
        tag = str(value).strip()
        if not _TAG_RE.match(tag):
            raise ValueError(
                "a radio-browser tag is a single word, for example jazz, blues or electronic"
            )
        return tag.lower()

    @staticmethod
    def check_point(value) -> tuple[float, float]:
        match = _POINT_RE.match(str(value))
        if not match:
            raise ValueError("a point is 'lat,lon', for example 40.7006,-74.0142")
        latitude, longitude = float(match.group(1)), float(match.group(2))
        if not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
            raise ValueError("latitude must be -90..90 and longitude -180..180")
        return round(latitude, 4), round(longitude, 4)

    @staticmethod
    def check_limit(value, default: int = 20) -> int:
        limit = _to_int(value)
        if limit is None:
            limit = default
        if not 1 <= limit <= 100:
            raise ValueError("limit must be between 1 and 100")
        return limit

    @staticmethod
    def check_order(value, default: str = "votes") -> str:
        order = str(value or default).strip().lower()
        if order not in ORDER_FIELDS:
            raise ValueError(f"order must be one of: {', '.join(ORDER_FIELDS)}")
        return order

    @staticmethod
    def check_healthy(value) -> bool:
        """`hidebroken` asks the mirror to drop streams whose last check failed."""
        if value in (None, ""):
            return False
        if isinstance(value, bool):
            return value
        if str(value).strip() in ("1", "true", "yes", "y"):
            return True
        if str(value).strip() in ("0", "false", "no", "n"):
            return False
        raise ValueError("healthy must be true or false")

    # -- reads -------------------------------------------------------------

    def search(self, name=None, country=None, tag=None, point=None, order="votes",
               reverse=True, healthy=None, limit=20) -> list[dict]:
        """Stations matching the filters given, ranked by the directory's own order.

        Every filter is optional and at least one is required: an unfiltered search
        would ask the mirror for a whole page of the directory for no reason.

        A positional search always sends `has_geo_info=true`. Without it the mirror
        answers with stations that hold no coordinates at all - a search near New York
        comes back with Lagos and Bond FM - which is worse than an empty answer.
        """
        params = {}
        if name:
            params["name"] = self.check_name(name)
        if country:
            params["countrycode"] = self.check_country(country)
        if tag:
            params["tag"] = self.check_tag(tag)
        origin = None
        if point:
            origin = self.check_point(point)
            params["latitude"], params["longitude"] = origin
            params["has_geo_info"] = "true"
        if not params:
            raise ValueError(
                "give me something to search for: a station name, a country, a genre tag or a point"
            )
        params["order"] = self.check_order(order)
        params["reverse"] = "true" if reverse else "false"
        if self.check_healthy(healthy):
            params["hidebroken"] = "true"
        limit = self.check_limit(limit)
        # The mirror ranks by `order`, not by distance, so a positional search reads a
        # wider page and cuts after sorting: taking the caller's limit first and then
        # sorting would just return the most-clicked stations on Earth, nearest-first
        # among themselves.
        params["limit"] = min(limit * 5, 100) if origin else limit
        payload = self.get_json(SEARCH_PATH, params, ttl=self.cache_ttl)
        rows = payload if isinstance(payload, list) else []
        stations = []
        for row in rows:
            if not isinstance(row, dict):
                continue
            stations.append(self._station(row))
        if origin:
            for station in stations:
                latitude, longitude = station.get("geo_lat"), station.get("geo_long")
                if station["distance_km"] is None and latitude is not None and longitude is not None:
                    station["distance_km"] = round(
                        haversine_km(origin[0], origin[1], latitude, longitude), 1)
                    station["distance_source"] = "computed from the directory's own coordinates"
            # The mirror ranks by whatever `order` says, not by distance, so "near me" is
            # answered by sorting here. A station with no distance sorts last rather than
            # pretending to be at zero.
            stations.sort(key=lambda row: (row["distance_km"] is None,
                                           row["distance_km"] if row["distance_km"] is not None else 0.0))
            stations = stations[:limit]
        return stations

    def station(self, station_uuid: str) -> dict | None:
        """One station's full record. None when the mirror does not hold it."""
        station_uuid = self.check_uuid(station_uuid)
        payload = self.get_json(BYUUID_PATH.format(uuid=station_uuid), {}, ttl=self.health_ttl)
        rows = payload if isinstance(payload, list) else None
        if not rows or not isinstance(rows[0], dict):
            return None
        return self._station(rows[0])

    def top_tags(self, limit: int = 25, only_known: bool = False) -> list[dict]:
        """The tags the directory indexes, most stations first.

        The mirror's list is alphabetical, not by count, so it is sorted here and
        then cut: an answer of `jazz, rock, pop` is only useful in that order.
        """
        limit = self.check_limit(limit, default=25)
        payload = self.get_json(TAGS_TOP_PATH, {}, ttl=86400.0)
        rows = payload if isinstance(payload, list) else []
        tags = []
        for row in rows:
            if not isinstance(row, dict):
                continue
            name = row.get("name")
            if not isinstance(name, str) or not name.strip():
                continue
            count = _to_int(row.get("stationcount"))
            if only_known and name.strip().lower() not in KNOWN_TAGS:
                continue
            tags.append({"tag": name.strip(), "stations": count})
        tags.sort(key=lambda row: (row["stations"] is None, -(row["stations"] or 0), row["tag"]))
        return tags[:limit]

    def languages(self, limit: int = 25) -> list[dict]:
        """The languages the directory indexes, most stations first."""
        limit = self.check_limit(limit, default=25)
        payload = self.get_json(LANGUAGES_PATH, {}, ttl=86400.0)
        rows = payload if isinstance(payload, list) else []
        found = []
        for row in rows:
            if not isinstance(row, dict):
                continue
            name = row.get("name")
            if not isinstance(name, str) or not name.strip():
                continue
            found.append({"language": name.strip(), "stations": _to_int(row.get("stationcount"))})
        found.sort(key=lambda row: (row["stations"] is None, -(row["stations"] or 0), row["language"]))
        return found[:limit]

    @staticmethod
    def freshness() -> str:
        """Every read here is live, so freshness is the moment we read it."""
        return utc_now_iso()

    def _station(self, row: dict) -> dict:
        station = self.pick(row, STATION_FIELDS, DATASET)
        station["tags_list"] = station_tags(row)
        station["health"] = station_health(row)
        station["healthy"] = _to_int(row.get("lastcheckok")) == 1
        station["stream_url"] = row.get("url_resolved") or row.get("url")
        station["bitrate_kbps"] = _to_int(row.get("bitrate"))
        station["distance_km"] = _to_float(row.get("geo_distance"))
        return station
