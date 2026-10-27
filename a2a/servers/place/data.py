"""Read-only client for two postal-code feeds: postcodes.io and zippopotam.us.

Endpoints (keyless, verified live 2026-09-28):
  - api.postcodes.io/postcodes/{postcode}        one UK postcode, fully geolocated
  - api.postcodes.io/postcodes?q=               UK postcode search by outward code
  - api.postcodes.io/postcodes?lon=&lat=        the UK postcodes nearest a point
  - api.zippopotam.us/{country}/{code}          one postal code, ~65 countries

Three things about these APIs shape the client:

1. They disagree about the world. postcodes.io covers the United Kingdom and carries
   the full ONS administrative geography — ward, parish, constituency, LSOA. Zippopotam
   covers everywhere except the UK and carries almost nothing beyond a place name and a
   state. So they are separate clients and separate skills, and neither one is asked
   to cover the other's gap: zippopotam answers HTTP 404 for a UK postcode.
2. Both answer an unknown code with HTTP 404, not with an empty body, and postcodes.io
   answers a search that matched nothing with HTTP 200 and `result: null`. Both are
   "no such place", so both are turned into None here rather than into a failure.
3. Zippopotam's field names contain spaces ("post code", "place name"), so the
   records are rebuilt into a stable shape instead of being passed through.
"""

from __future__ import annotations

import math
import os
import re
from urllib import parse as urlparse

from a2a_kit import JsonApiClient, UpstreamError, utc_now_iso

POSTCODES_BASE = "https://api.postcodes.io"
POSTCODES_PATH = "/postcodes"
POSTCODES_ONE_PATH = "/postcodes/{postcode}"
ZIPPOPOTAM_BASE = "https://api.zippopotam.us"
ZIPPOPOTAM_PATH = "/{country}/{code}"

UK_DATASET = "api.postcodes.io"
WORLD_DATASET = "api.zippopotam.us"
PRODUCT = "UK postcodes and administrative areas (postcodes.io) and world postal codes (zippopotam.us)"
SOURCE = "postcodes.io (ONS Open Postcode Directory) and zippopotam.us"

#: Both catalogues change rarely: postcode geography is fixed, and only additions land.
CATALOGUE_TTL = 86400.0

MAX_RESULTS = 25
#: postcodes.io's reverse lookup is documented in metres, and its own count cap is 100.
REVERSE_RADIUS_M = 10000
REVERSE_LIMIT = 100

#: The ONS fields worth showing, in the order a reader wants them.
UK_FIELDS = ("postcode", "quality", "country", "region", "admin_district", "admin_county",
             "admin_ward", "parish", "lsoa", "msoa", "parliamentary_constituency",
             "european_electoral_region", "primary_care_trust", "nhs_ha", "longitude",
             "latitude", "eastings", "northings", "outcode", "incode", "date_of_introduction")

#: A UK postcode: an outward code plus an inward code, with the space optional.
UK_POSTCODE_RE = re.compile(r"^([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})$", re.IGNORECASE)
#: A UK outward code on its own, for the search skill.
UK_OUTWARD_RE = re.compile(r"^[A-Z]{1,2}\d[A-Z\d]?$", re.IGNORECASE)
#: A zippopotam country code: the ISO 3166-1 alpha-2 codes that feed supports.
COUNTRY_RE = re.compile(r"^[A-Za-z]{2}$")
#: A postal code anywhere: letters, digits, spaces, dashes — and nothing else.
WORLD_CODE_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9 -]{0,15}$")
_POINT_RE = re.compile(r"^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$")

__all__ = [
    "CATALOGUE_TTL",
    "MAX_RESULTS",
    "POSTCODES_BASE",
    "POSTCODES_ONE_PATH",
    "POSTCODES_PATH",
    "REVERSE_LIMIT",
    "REVERSE_RADIUS_M",
    "UK_DATASET",
    "UK_FIELDS",
    "UK_OUTWARD_RE",
    "UK_POSTCODE_RE",
    "WORLD_CODE_RE",
    "WORLD_DATASET",
    "ZIPPOPOTAM_BASE",
    "ZIPPOPOTAM_PATH",
    "PlaceClient",
    "UpstreamError",
    "haversine_km",
]


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in kilometres."""
    radius = 6371.0088
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    return 2 * radius * math.asin(math.sqrt(a))


def normalise_uk_postcode(value) -> str:
    """A UK postcode to its canonical spaced form, or a ValueError if it is not one."""
    raw = re.sub(r"\s+", " ", str(value).strip().upper())
    match = UK_POSTCODE_RE.match(raw)
    if not match:
        raise ValueError(
            "a UK postcode is an outward code and an inward code, such as SW1A 1AA or M1 1AE"
        )
    return f"{match.group(1)} {match.group(2)}"


#: urllib phrases it "HTTP Error 404: Not Found"; postcodes.io also sends 404 for a
#: code it does not hold. Either way it means "no such place", not a broken feed.
_NOT_FOUND_RE = re.compile(r"\b404\b")


def _is_not_found(exc: Exception) -> bool:
    return isinstance(exc, UpstreamError) and bool(_NOT_FOUND_RE.search(str(exc)))


class PlaceClient(JsonApiClient):
    """Both postal feeds, behind one client. Read-only, no key, cached."""

    env_prefix = "PLACE"
    base_url = POSTCODES_BASE

    def __init__(self, fetch=None, base_url=None, cache_ttl=None, timeout=None, headers=None,
                 world_base_url=None) -> None:
        super().__init__(fetch=fetch, base_url=base_url, cache_ttl=cache_ttl, timeout=timeout, headers=headers)
        self.catalogue_ttl = float(os.environ.get(f"{self.env_prefix}_CATALOGUE_TTL", CATALOGUE_TTL))
        self.world_base_url = (world_base_url or os.environ.get(f"{self.env_prefix}_WORLD_BASE_URL")
                               or ZIPPOPOTAM_BASE).rstrip("/")
        self.ttl = min(self.catalogue_ttl, self.cache_ttl)

    # -- validation --------------------------------------------------------

    @staticmethod
    def check_country(value) -> str:
        country = str(value or "").strip().lower()
        if not COUNTRY_RE.match(country):
            raise ValueError("a country is its two-letter code, such as US, DE, JP or CA")
        return country

    @staticmethod
    def check_world_code(value) -> str:
        code = re.sub(r"\s+", " ", str(value).strip())
        if not WORLD_CODE_RE.match(code):
            raise ValueError("that does not look like a postal code")
        return code

    @staticmethod
    def check_point(point) -> tuple[float, float]:
        match = _POINT_RE.match(str(point))
        if not match:
            raise ValueError("a point is 'lat,lon', for example 51.5010,-0.1416")
        lat, lon = float(match.group(1)), float(match.group(2))
        if not -90 <= lat <= 90 or not -180 <= lon <= 180:
            raise ValueError("latitude must be -90..90 and longitude -180..180")
        return round(lat, 5), round(lon, 5)

    @staticmethod
    def check_limit(value, maximum: int = MAX_RESULTS) -> int:
        try:
            limit = int(value)
        except (TypeError, ValueError):
            raise ValueError("limit must be a whole number") from None
        if not 1 <= limit <= maximum:
            raise ValueError(f"limit must be between 1 and {maximum}")
        return limit

    @staticmethod
    def check_radius_km(value) -> float:
        try:
            radius = float(value)
        except (TypeError, ValueError):
            raise ValueError("radius must be a number of kilometres") from None
        if not 0.1 <= radius <= 25:
            raise ValueError("radius must be between 0.1 and 25 km")
        return round(radius, 2)

    @staticmethod
    def looks_like_uk_postcode(value: str) -> bool:
        return bool(UK_POSTCODE_RE.match(re.sub(r"\s+", " ", str(value).strip().upper())))

    # -- postcodes.io ------------------------------------------------------

    def uk_postcode(self, postcode: str) -> dict | None:
        """One UK postcode and its full administrative geography, or None if there is none."""
        canonical = normalise_uk_postcode(postcode)
        try:
            # A UK postcode contains a space, so the path segment is encoded here rather
            # than left for the caller to get right.
            payload = self.get_json(
                POSTCODES_ONE_PATH.format(postcode=urlparse.quote(canonical, safe="")), {}, ttl=self.ttl)
        except UpstreamError as exc:
            if _is_not_found(exc):
                return None
            raise
        row = (payload or {}).get("result")
        if not isinstance(row, dict):
            return None
        return {**self.pick(row, UK_FIELDS), "dataset": UK_DATASET}

    def uk_search(self, query: str, limit: int = 10) -> list[dict]:
        """UK postcodes matching an outward code or a partial postcode, or an empty list."""
        needle = re.sub(r"\s+", " ", str(query).strip())
        if not needle or not re.match(r"^[A-Za-z0-9][A-Za-z0-9 ]{0,8}$", needle):
            raise ValueError("search a UK outward code such as SW1A, M1 or EH12")
        limit = self.check_limit(limit)
        payload = self.get_json(POSTCODES_PATH, {"q": needle, "limit": limit}, ttl=self.ttl)
        rows = (payload or {}).get("result")
        if not isinstance(rows, list):
            return []
        return [{**self.pick(row, UK_FIELDS), "dataset": UK_DATASET} for row in rows][:limit]

    def uk_nearest(self, point: str, radius_km: float = 2.0, limit: int = 10) -> list[dict]:
        """The UK postcodes nearest a point, with real distances, inside a radius.

        postcodes.io caps the count at 100 whatever `limit` says, and its own default
        radius is 100 m, so the radius is asked for explicitly and the returned count
        is reported rather than assumed.
        """
        lat, lon = self.check_point(point)
        radius_km = self.check_radius_km(radius_km)
        limit = self.check_limit(limit, REVERSE_LIMIT)
        params = {
            "lon": lon,
            "lat": lat,
            "limit": min(limit, REVERSE_LIMIT),
            "radius": min(int(radius_km * 1000), REVERSE_RADIUS_M),
        }
        payload = self.get_json(POSTCODES_PATH, params, ttl=self.ttl)
        rows = (payload or {}).get("result")
        if not isinstance(rows, list):
            return []
        matches = []
        for row in rows:
            row_lat, row_lon = _to_float(row.get("latitude")), _to_float(row.get("longitude"))
            if row_lat is None or row_lon is None:
                continue
            distance = round(haversine_km(lat, lon, row_lat, row_lon), 4)
            if distance > radius_km:
                continue
            matches.append({**self.pick(row, UK_FIELDS), "distance_km": distance,
                            "dataset": UK_DATASET})
        matches.sort(key=lambda match: match["distance_km"])
        return matches[:limit]

    # -- zippopotam --------------------------------------------------------

    def world_postcode(self, country: str, code: str) -> list[dict] | None:
        """Places inside one postal code, anywhere but the UK, or None if there is none.

        Zippopotam has no UK coverage — it answers 404 for a British postcode — which
        is why a UK code is refused here rather than passed to it and reported missing.
        """
        country_code = self.check_country(country)
        postal_code = self.check_world_code(code)
        if country_code == "gb":
            raise ValueError(
                "zippopotam.us does not cover the United Kingdom; use the UK postcode skill for GB codes"
            )
        # Several of zippopotam's codes contain a space, so the path is encoded here too.
        url = (f"{self.world_base_url}"
               f"{ZIPPOPOTAM_PATH.format(country=country_code, code=urlparse.quote(postal_code, safe=''))}")
        try:
            # get_json passes an absolute URL straight through, so the world feed is
            # cached on the same terms as the UK one.
            payload = self.get_json(url, {}, ttl=self.ttl)
        except UpstreamError as exc:
            if _is_not_found(exc):
                return None
            raise
        if not isinstance(payload, dict) or not payload.get("places"):
            return None
        places = []
        for place in payload["places"]:
            places.append({
                "country": payload.get("country") or "not reported",
                "country_code": payload.get("country abbreviation") or country_code,
                "postal_code": payload.get("post code") or postal_code,
                "place": place.get("place name") or "not reported",
                "state": place.get("state"),
                "state_code": place.get("state abbreviation"),
                "latitude": _to_float(place.get("latitude")),
                "longitude": _to_float(place.get("longitude")),
                "dataset": WORLD_DATASET,
            })
        return places

    @staticmethod
    def freshness() -> str:
        """Postcode geography is fixed, so freshness is when the entry was read."""
        return utc_now_iso()


def _to_float(value) -> float | None:
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None
