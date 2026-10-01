"""What is in a postal code, and how far is one from another, from Zippopotam (keyless).

Verified live on 2026-09-28:

  https://api.zippopotam.us/us/11235
      -> Brooklyn, New York, at 40.5839 / -73.9536
  https://api.zippopotam.us/nl/1012
      -> Amsterdam Binnenstad en Oostelijk Havengebied, Noord-Holland
  https://api.zippopotam.us/jp/100-0001
      -> Chiyoda, Toukyouto

Three things this directory does and does not do, and this reader keeps straight. It is
keyed **by postal code**, so it answers "what is in 11235" and cannot answer "what is the
ZIP for Aspen" - there is no search endpoint, and inventing a reverse lookup by guessing
codes is not something this agent will do. It is also light on detail per code: a US code
carries one place name and two coordinates, and there is no boundary, no population and
no list of adjacent codes, so "what does this ZIP border" is not available from it either.
And a code means different things in different countries - `1012` is an Amsterdam
postcode and `101` is an Icelandic one - so the country is part of the lookup, not an
optional extra. The table below is the directory's own coverage, read live on 2026-09-28
by looking up one real code per country, so every row in it is a code the directory
actually answered for rather than a format guessed from Wikipedia.
"""

from __future__ import annotations

import json
import math
import os
import re
import time
from urllib import parse, request
from urllib.error import HTTPError

API = "https://api.zippopotam.us/"

DATASET = "Zippopotam postal code directory (api.zippopotam.us)"

DEFAULT_USER_AGENT = "awesome-acps-zip/1.0 (+https://github.com/mrfentmen/awesome-acps)"

#: The directory's coverage: `(ISO country code, a real example code, the country name)`,
#: every row read live on 2026-09-28 by looking that exact code up. It is the lookup
#: table, because the API needs a country and answering "which country uses this format"
#: without one would mean guessing.
COUNTRIES: tuple[tuple[str, str, str], ...] = (
    ("at", "1010", "Austria"),
    ("au", "2000", "Australia"),
    ("be", "1000", "Belgium"),
    ("bg", "1000", "Bulgaria"),
    ("br", "01000-000", "Brazil"),
    ("ch", "8001", "Switzerland"),
    ("de", "10115", "Germany"),
    ("dk", "1000", "Denmark"),
    ("es", "28001", "Spain"),
    ("fi", "00100", "Finland"),
    ("fr", "75001", "France"),
    ("hr", "10000", "Croatia"),
    ("hu", "1011", "Hungary"),
    ("in", "110001", "India"),
    ("is", "101", "Iceland"),
    ("it", "00100", "Italy"),
    ("jp", "100-0001", "Japan"),
    ("mx", "01000", "Mexico"),
    ("my", "50000", "Malaysia"),
    ("nl", "1012", "Netherlands"),
    ("no", "0001", "Norway"),
    ("nz", "6011", "New Zealand"),
    ("ph", "1000", "Phillippines"),
    ("pl", "00-001", "Poland"),
    ("pt", "1000-001", "Portugal"),
    ("ru", "101000", "Russia"),
    ("th", "10100", "Thailand"),
    ("tr", "06000", "Turkey"),
    ("us", "11235", "United States"),
    ("za", "8001", "South Africa"),
)

#: Mean Earth radius, km. The only Earth constant a postal-code distance needs.
EARTH_RADIUS_KM = 6371.0
DEG = math.pi / 180
RAD = 180 / math.pi
MILES_PER_KM = 0.621371
KM_PER_MILE = 1.609344

#: Countries people ask about that the directory does **not** carry, so the agent
#: can say so instead of looking a code up and getting a 404 with no explanation.
#: Verified 2026-09-28: /gb/, /ca/, /ie/, /sg/ and /cy/ all answered HTTP 404.
NO_COVERAGE = {"gb": "the United Kingdom", "uk": "the United Kingdom", "ca": "Canada",
                "ie": "Ireland", "sg": "Singapore", "cy": "Cyprus"}

#: The two speeds the travel estimates use. Both are published round figures and
#: both are labelled as estimates in the answer, because neither is this agent's
#: measurement of a real road.
WALK_KMH = 5.0
DRIVE_KMH = 80.0

COMPASS = ("N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
           "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW")


class ZipError(RuntimeError):
    """The postal code directory could not be read."""


class ZipNotFound(ZipError):
    """The directory answered 404, or named no code - a real 'nothing here'."""


def normalise(text: str) -> str:
    """A postal code as the directory wants it: upper case, no stray spaces."""
    return "".join(str(text or "").upper().split())


def country_code_from_text(text: str) -> str | None:
    """An ISO country code written in a question, from a country name or a code.

    A country *name* is matched whatever its case. A two-letter *code* is only
    matched when the question wrote it in capitals, because every ISO alpha-2 code
    is also an English word or fragment - `in`, `is`, `it`, `no`, `at`, `be` - and
    reading "what is in 11235" as the country `in` would be nonsense.
    """
    original = str(text or "")
    lowered = " ".join(original.lower().split())
    if not lowered:
        return None
    for code, _example, name in COUNTRIES:
        if re.search(rf"\b{re.escape(name.lower())}\b", lowered):
            return code
    for match in re.finditer(r"\b([A-Za-z]{2})\b", original):
        token = match.group(1)
        if not token.isupper():
            continue
        lowered = token.lower()
        for code, _example, _name in COUNTRIES:
            if code == lowered:
                return code
    return None


def postal_code_from_text(text: str) -> str | None:
    """A postal code written in a question.

    A postal code is country-specific, so this only takes a token that carries
    letters, digits and at most one separator: `11235`, `100-0001`, `00-001` and
    `01000-000` are all codes, and a bare number like `1` is not.
    """
    for match in re.finditer(r"(?<![\w-])([A-Za-z]{0,2}\d[A-Za-z0-9]*(?:[- ][A-Za-z0-9]{2,4})?)"
                             r"(?![\w-])", str(text or "")):
        candidate = normalise(match.group(1))
        if len(candidate) >= 3 and any(character.isdigit() for character in candidate):
            return candidate
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


def compass_point(degrees: float | None) -> str:
    """A bearing as a compass point, or 'not reported' when there is no bearing."""
    if degrees is None:
        return "not reported"
    return COMPASS[round(degrees / 22.5) % 16]


class ZipData:
    """One postal code's record, and the directory's country coverage."""

    def __init__(self, fetch=None, cache_ttl: float = 604800.0, timeout: float = 40.0,
                 user_agent: str | None = None) -> None:
        self.cache_ttl = float(os.environ.get("ZIP_CACHE_TTL", cache_ttl))
        self.timeout = float(os.environ.get("ZIP_HTTP_TIMEOUT", timeout))
        self.user_agent = (user_agent or os.environ.get("ZIP_USER_AGENT")
                           or DEFAULT_USER_AGENT)
        self._fetch = fetch or self._http_json
        self._cache: dict[str, tuple[float, object]] = {}

    # -- transport ---------------------------------------------------------

    def _http_json(self, url: str) -> object:
        req = request.Request(url, headers={"User-Agent": self.user_agent,
                                            "Accept": "application/json"})
        try:
            with request.urlopen(req, timeout=self.timeout) as resp:
                body = resp.read().decode("utf-8", "replace")
        except HTTPError as exc:
            if exc.code == 404:
                raise ZipNotFound("the directory has no record for that postal code") from exc
            raise ZipError(f"the directory answered HTTP {exc.code}") from exc
        except Exception as exc:  # urllib raises many other types too
            raise ZipError(f"request failed: {exc}") from exc
        if not body.strip():
            return {}
        try:
            return json.loads(body)
        except ValueError as exc:
            raise ZipError(f"the directory returned something that is not JSON: {exc}") from exc

    def _get(self, country: str, code: str) -> dict:
        """One cached GET, keyed on the pair because a code is not unique alone."""
        cache_key = f"{country}/{code}"
        now = time.time()
        hit = self._cache.get(cache_key)
        if hit and hit[0] > now:
            return hit[1]
        payload = self._fetch(f"{API}{country}/{parse.quote(code)}")
        if isinstance(payload, (str, bytes)):
            try:
                payload = json.loads(payload)
            except ValueError as exc:
                raise ZipError(f"the directory returned something that is not JSON: {exc}") from exc
        if not isinstance(payload, dict) or not payload:
            raise ZipNotFound(f"the directory has no record for {code!r} in {country!r}")
        self._cache[cache_key] = (now + self.cache_ttl, payload)
        return payload

    # -- reads -------------------------------------------------------------

    def postal_code(self, country: str, code: str) -> dict:
        """One postal code's record, with its places and their coordinates.

        The directory returns a code as a bare string and a place's coordinates as
        strings, so both are converted here; a place with unparseable coordinates
        is kept and reported as having none rather than dropped, because the place
        name is still a real answer.
        """
        wanted = normalise(code)
        if not wanted:
            raise ValueError("tell me a postal code, for example 11235 or 100-0001")
        iso = normalise(country).lower()
        if not iso or not iso.isalpha() or len(iso) != 2:
            raise ValueError("tell me the country too, because a postal code means nothing "
                             "without one - 1012 is Amsterdam and 101 is Iceland")
        payload = self._get(iso, wanted)
        places = []
        for entry in payload.get("places") or []:
            places.append({
                "name": entry.get("place name") or "not reported",
                "state": entry.get("state"),
                "state_abbreviation": entry.get("state abbreviation") or None,
                "latitude": _number(entry.get("latitude")),
                "longitude": _number(entry.get("longitude")),
            })
        if not places:
            raise ZipNotFound(f"the directory lists {wanted} but names no place in it")
        return {
            "country": payload.get("country") or "not reported",
            "country_abbreviation": payload.get("country abbreviation") or iso,
            "postal_code": payload.get("post code") or wanted,
            "places": places,
            "count": len(places),
            "source": DATASET,
        }

    def countries(self) -> list[dict]:
        """The directory's coverage. No call: it is the verified table above."""
        return [{"country": name, "code": code, "example_postal_code": example}
                for code, example, name in COUNTRIES]


def _number(value) -> float | None:
    """A published coordinate as a float, or None when the directory published none."""
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None
