"""Where a UK postcode is, and which authority owns it, from postcodes.io (keyless).

Verified live on 2026-09-28:

  /postcodes/EC1A1BB      -> 60-odd fields: admin_district Islington, admin_ward
                             Clerkenwell, icb "NHS West and North London Integrated
                             Care Board", lsoa Islington 022F, plus a `codes` block of
                             the ONS numeric codes for every one of them
  /outcodes/LS1           -> the district: admin_district ['Leeds'], a centroid, and
                             the parish list
  /postcodes?lon=&lat=    -> the nearest postcodes to a point, no distances published

Three things the payloads make plain and this reader keeps. The `quality` field is
an ordinal from 1 to 5, where 1 is a *live* postcode and 5 is one withdrawn on
1996-02-01, so a quality of 5 is a dead postcode and reading it as a "score" would
miss that. Almost every authority field can be `null`, and a null ward means the
postcode genuinely has no ward, which is different from a lookup that failed. And
the nearest-postcode query publishes no distance: it returns rows ordered by
proximity, so any distance has to be computed rather than read.
"""

from __future__ import annotations

import json
import math
import os
import re
import time
from urllib import parse, request
from urllib.error import HTTPError

API = "https://api.postcodes.io/"

DATASET = "postcodes.io (ONS Postcodes Directory)"

DEFAULT_USER_AGENT = "awesome-acps-uk-postcode/1.0 (+https://github.com/mrfentmen/awesome-acps)"

#: The UK's postcode formats: `SW1A 1AA` (area, district, sector, unit),
#: `EC1A1BB` written without a space, and the partial forms an area or a district
#: on its own. The full form is what `/postcodes/` accepts; the partial forms are
#: what `/outcodes/` and `/postcodes/` both take.
_POSTCODE_RE = re.compile(r"\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})?\b", re.IGNORECASE)

#: An outcode standing on its own: the district part, not followed by a sector and
#: a unit. The negative lookahead is what separates `SW1A` in "what is in SW1A?"
#: from the `SW1A` at the front of "SW1A 1AA", which is a postcode and not a
#: district.
_OUTCODE_RE = re.compile(
    r"(?<![A-Z0-9])([A-Z]{1,2}\d[A-Z\d]?)(?![A-Z0-9])(?!\s+\d[A-Z]{2})", re.IGNORECASE)

#: The health fields a "which NHS area" question is actually about, in the order
#: they nest: NHS region -> integrated care board -> the older clinical
#: commissioning group, which is still what many documents quote.
HEALTH_FIELDS = ("nhs_region", "nhs_ha", "icb", "ccg", "primary_care_trust",
                 "cancer_alliance")

#: The political and statistical geography fields, which is what "who governs it"
#: is asking for.
GOVERNANCE_FIELDS = ("parliamentary_constituency", "admin_ward", "lsoa", "msoa",
                     "nuts", "pfa", "region", "admin_county", "parish",
                     "european_electoral_region", "bua")

#: Mean Earth radius, km. The only Earth constant a postcode distance needs.
EARTH_RADIUS_KM = 6371.0

#: 1 statute mile, km. Postcode distances in Britain are quoted in miles, so both.
MILES_PER_KM = 0.621371

#: `quality` 1 is live; 5 was withdrawn on 1996-02-01. The whole ladder is here
#: because a caller has to be able to say which one a record carries.
QUALITY_NOTES = {
    1: "live, the postcode is in the directory and receives mail",
    2: "live, the postcode is no longer used for delivery",
    3: "live, a large-volume user postcode",
    4: "historical, the postcode was withdrawn on 1996-02-01",
    5: "historical, the postcode was withdrawn on 1996-02-01 and is not in use",
}


class PostcodeError(RuntimeError):
    """postcodes.io could not be read."""


class PostcodeNotFound(PostcodeError):
    """The directory answered 404, or named no postcode - a real 'nothing here'."""


def normalise(text: str) -> str:
    """A postcode in the form the directory wants: upper case, one space, in before out."""
    work = " ".join(str(text or "").upper().split())
    return re.sub(r"\s+", " ", work).strip()


def postcode_from_text(text: str) -> str | None:
    """A full postcode (`SW1A 1AA`) written anywhere in the question, or None.

    A bare outcode like `SW1A` is deliberately not matched here: it is a district
    covering thousands of postcodes, and the agent answers that with the outcode
    skill rather than pretending it is one postcode.
    """
    for match in _POSTCODE_RE.finditer(str(text or "").upper()):
        if match.group(2):
            return f"{match.group(1)} {match.group(2)}"
    return None


def outcode_from_text(text: str) -> str | None:
    """A bare postcode district (`SW1A`) written anywhere in the question, or None.

    A district on its own is not a postcode, so this is deliberately a separate
    matcher: it needs the outcode to stand alone, with no sector and no unit
    after it, so `SW1A` in "what is in SW1A?" is a district and `SW1A 1AA` is a
    postcode.
    """
    for match in _OUTCODE_RE.finditer(normalise(text)):
        return match.group(1)
    return None


def great_circle_km(lat_a: float, lon_a: float, lat_b: float, lon_b: float) -> float:
    """Distance between two points on the globe, in km."""
    phi_a, phi_b = math.radians(lat_a), math.radians(lat_b)
    d_phi = phi_b - phi_a
    d_lambda = math.radians(lon_b - lon_a)
    a = (math.sin(d_phi / 2) ** 2
         + math.cos(phi_a) * math.cos(phi_b) * math.sin(d_lambda / 2) ** 2)
    return 2 * EARTH_RADIUS_KM * math.asin(min(1.0, math.sqrt(a)))


def bearing_deg(lat_a: float, lon_a: float, lat_b: float, lon_b: float) -> float:
    """The initial great-circle bearing from one point to another, 0-360 degrees."""
    phi_a, phi_b = math.radians(lat_a), math.radians(lat_b)
    d_lambda = math.radians(lon_b - lon_a)
    y = math.sin(d_lambda) * math.cos(phi_b)
    x = (math.cos(phi_a) * math.sin(phi_b)
         - math.sin(phi_a) * math.cos(phi_b) * math.cos(d_lambda))
    return (math.degrees(math.atan2(y, x)) + 360) % 360


_COMPASS = ("N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
            "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW")


def compass_point(degrees: float | None) -> str:
    """A bearing as a compass point, or 'not reported' when there is no bearing."""
    if degrees is None:
        return "not reported"
    return _COMPASS[round(degrees / 22.5) % 16]


class PostcodeData:
    """One postcode's record, a district's record, and the nearest postcodes."""

    def __init__(self, fetch=None, cache_ttl: float = 86400.0, timeout: float = 40.0,
                 user_agent: str | None = None) -> None:
        self.cache_ttl = float(os.environ.get("UK_POSTCODE_CACHE_TTL", cache_ttl))
        self.timeout = float(os.environ.get("UK_POSTCODE_HTTP_TIMEOUT", timeout))
        self.user_agent = (user_agent or os.environ.get("UK_POSTCODE_USER_AGENT")
                           or DEFAULT_USER_AGENT)
        self._fetch = fetch or self._http_json
        self._cache: dict[str, tuple[float, object]] = {}

    # -- transport ---------------------------------------------------------

    def _http_json(self, url: str, params: dict | None = None) -> object:
        query = f"{url}?{parse.urlencode(params, doseq=True)}" if params else url
        req = request.Request(query, headers={"User-Agent": self.user_agent,
                                              "Accept": "application/json"})
        try:
            with request.urlopen(req, timeout=self.timeout) as resp:
                body = resp.read().decode("utf-8", "replace")
        except HTTPError as exc:
            if exc.code == 404:
                raise PostcodeNotFound("the directory has no record for that postcode") from exc
            raise PostcodeError(f"postcodes.io answered HTTP {exc.code}") from exc
        except Exception as exc:  # urllib raises many other types too
            raise PostcodeError(f"request failed: {exc}") from exc
        if not body.strip():
            return {}
        try:
            return json.loads(body)
        except ValueError as exc:
            raise PostcodeError(f"postcodes.io returned something that is not JSON: {exc}") from exc

    def _get(self, path: str, params: dict | None = None,
             ttl: float | None = None) -> dict:
        """One cached GET. The directory is stable, so the default cache is a day."""
        url = f"{API}{path}"
        cache_key = url + (f"?{parse.urlencode(params, doseq=True)}" if params else "")
        now = time.time()
        hit = self._cache.get(cache_key)
        if hit and hit[0] > now:
            return hit[1]
        payload = self._fetch(url, params)
        if isinstance(payload, (str, bytes)):
            try:
                payload = json.loads(payload)
            except ValueError as exc:
                raise PostcodeError(f"postcodes.io returned something that is not JSON: {exc}") from exc
        if not isinstance(payload, dict):
            raise PostcodeError("postcodes.io returned an unexpected payload")
        if payload.get("status") == 404 or payload.get("error"):
            raise PostcodeNotFound(str(payload.get("error") or "no record for that postcode"))
        self._cache[cache_key] = (now + (ttl if ttl is not None else self.cache_ttl), payload)
        return payload

    # -- reads -------------------------------------------------------------

    def postcode(self, code: str) -> dict:
        """One postcode's full record, as the directory publishes it.

        The `codes` block is kept whole: it is the ONS numeric code for every
        authority field above, and it is the only place a caller gets something
        they can join against another ONS dataset with.
        """
        wanted = normalise(code).replace(" ", "")
        if not wanted:
            raise ValueError("tell me a postcode, for example SW1A 1AA")
        payload = self._get(f"postcodes/{parse.quote(wanted)}")
        result = payload.get("result")
        if not isinstance(result, dict):
            raise PostcodeNotFound(f"the directory has no record for {normalise(code)}")
        return {**result, "source": DATASET}

    def outcode(self, district: str) -> dict:
        """A postcode district's record: its centroid, and every district it covers."""
        wanted = normalise(district).replace(" ", "")
        if not wanted:
            raise ValueError("tell me a postcode district, for example SW1A")
        payload = self._get(f"outcodes/{parse.quote(wanted)}")
        result = payload.get("result")
        if not isinstance(result, dict):
            raise PostcodeNotFound(f"the directory has no record for the district {wanted}")
        districts = result.get("admin_district")
        return {**result,
                "admin_district": districts[0] if isinstance(districts, list) and districts else None,
                "admin_districts": districts if isinstance(districts, list) else [],
                "parishes": result.get("parish") if isinstance(result.get("parish"), list) else [],
                "source": DATASET}

    def nearest(self, latitude: float, longitude: float, limit: int = 100,
                radius_m: int = 1000) -> list[dict]:
        """The postcodes nearest a point, nearest first.

        The directory orders these by proximity and publishes **no distance**, so
        every distance here is computed from the two published coordinates. That is
        stated in the answer rather than hidden, because a straight-line distance
        between two postcodes' centroids is not the same as walking distance.

        The `radius` is the directory's own search filter and it is not optional:
        without it the query answers with the single postcode that owns that exact
        point, and 1 km already returns the full 100 rows the cap allows.
        """
        wanted = max(1, min(int(limit), 100))
        payload = self._get("postcodes", {
            "lon": f"{float(longitude):.6f}",
            "lat": f"{float(latitude):.6f}",
            "radius": str(max(1, min(int(radius_m), 200000))),
            "limit": str(wanted),
        }, ttl=3600.0)
        results = payload.get("result")
        if not isinstance(results, list):
            raise PostcodeNotFound("the directory published no postcodes near that point")
        rows = []
        for entry in results:
            try:
                lat = float(entry.get("latitude"))
                lon = float(entry.get("longitude"))
            except (TypeError, ValueError):
                #: A record with no coordinates cannot be placed, so it is dropped
                #: rather than reported at a distance of zero.
                continue
            distance = great_circle_km(float(latitude), float(longitude), lat, lon)
            rows.append({
                "postcode": entry.get("postcode"),
                "admin_district": entry.get("admin_district"),
                "admin_ward": entry.get("admin_ward"),
                "nhs_region": entry.get("nhs_region"),
                "icb": entry.get("icb"),
                "parliamentary_constituency": entry.get("parliamentary_constituency"),
                "country": entry.get("country"),
                "quality": entry.get("quality"),
                "latitude": lat,
                "longitude": lon,
                "distance_km": round(distance, 3),
                "distance_miles": round(distance * MILES_PER_KM, 3),
            })
        rows.sort(key=lambda row: row["distance_km"])
        return rows


def _num(value) -> str:
    """A number for a line of text, or the honest 'not reported'."""
    if value is None or value == "":
        return "not reported"
    try:
        return f"{float(value):g}"
    except (TypeError, ValueError):
        return str(value)
