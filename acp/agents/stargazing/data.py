"""Sky conditions for observing, keyless, from 7Timer's astronomical product.

Verified live on 2026-09-28:

  .../bin/api.pl?lon=-73.9&lat=40.7&product=astro&output=json
      -> HTTP 200, product 'astro', init '2026092818', 24 slots
      -> timepoint 3:  cloudcover 9, seeing 7, transparency 5, lifted_index 10,
         rh2m 12, temp2m 15, wind10m {direction 'N', speed 3}, prec_type 'none'
      -> timepoint 72: cloudcover 8, seeing 8, transparency 3, lifted_index 6,
         temp2m 27, prec_type 'none'

Three things the payloads make plain and this reader keeps. **The three indices run in
the same direction - bigger is better.** Cloud cover is 1 (fully covered) to 9 (no
cloud), seeing is 1 (very bad) to 8 (very good), transparency is 1 (very bad) to 7
(excellent), so reading a low cloud cover as "clear" would invert the whole answer.
**`init` is YYYYMMDDHH in UTC** and a timepoint is hours *after* it, not an hour of
the day, so timepoint 3 in a run that started at 18:00 is 21:00 UTC. And the run is
**24 slots of 3 hours, so 72 hours**, not the 48 the product's name suggests.

There is no moon data in this product, and the moon matters more than any of these
indices for faint targets, so nothing here claims to know the phase.
"""

from __future__ import annotations

import datetime
import json
import os
import re
import time
from urllib import parse, request
from urllib.error import HTTPError

ASTRO_URL = "https://www.7timer.info/bin/api.pl"

DATASET = "7Timer astronomical forecast (www.7timer.info)"

DEFAULT_USER_AGENT = "awesome-acps-stargazing/1.0 (+https://github.com/mrfentmen/awesome-acps)"

#: 7Timer astro runs 24 slots of 3 hours, which is 72 hours, not 48.
SLOTS = 24
SLOT_HOURS = 3

#: What the published index scales are, so an answer can say what a 9 means.
CLOUD_SCALE = {1: "fully covered", 2: "almost completely covered", 3: "mostly covered",
               4: "covered", 5: "roughly half covered", 6: "half or less covered",
               7: "mostly clear", 8: "nearly clear", 9: "no cloud at all"}
SEEING_SCALE = {1: "very bad", 2: "bad", 3: "poor", 4: "below average", 5: "average",
                6: "above average", 7: "good", 8: "very good"}
TRANSPARENCY_SCALE = {1: "very bad", 2: "bad", 3: "poor", 4: "below average",
                      5: "average", 6: "good", 7: "excellent"}

#: Cities an editor is likely to ask about, with the coordinates 7Timer wants.
PLACES = {
    "new york": (40.7128, -74.0060, "New York, New York"),
    "los angeles": (34.0522, -118.2437, "Los Angeles, California"),
    "chicago": (41.8781, -87.6298, "Chicago, Illinois"),
    "san francisco": (37.7749, -122.4194, "San Francisco, California"),
    "seattle": (47.6062, -122.3321, "Seattle, Washington"),
    "denver": (39.7392, -104.9903, "Denver, Colorado"),
    "boston": (42.3601, -71.0589, "Boston, Massachusetts"),
    "london": (51.5074, -0.1278, "London, United Kingdom"),
    "edinburgh": (55.9533, -3.1883, "Edinburgh, United Kingdom"),
    "berlin": (52.5200, 13.4050, "Berlin, Germany"),
    "paris": (48.8566, 2.3522, "Paris, France"),
    "madrid": (40.4168, -3.7038, "Madrid, Spain"),
    "tokyo": (35.6762, 139.6503, "Tokyo, Japan"),
    "sydney": (-33.8688, 151.2093, "Sydney, Australia"),
    "auckland": (-36.8485, 174.7633, "Auckland, New Zealand"),
    "cape town": (-33.9249, 18.4241, "Cape Town, South Africa"),
    "cairo": (30.0444, 31.2357, "Cairo, Egypt"),
    "mexico city": (19.4326, -99.1332, "Mexico City, Mexico"),
    "sao paulo": (-23.5505, -46.6333, "Sao Paulo, Brazil"),
    "los angeles desert": (34.8697, -111.7610, "Sonoran Desert, Arizona"),
    "mauna kea": (19.8207, -155.4681, "Mauna Kea, Hawaii"),
    "atacama": (-24.6272, -70.4042, "Atacama Desert, Chile"),
}


class StargazingError(RuntimeError):
    """7Timer could not be read."""


class StargazingNotFound(StargazingError):
    """7Timer answered, and holds no forecast for that point."""


def place_from_text(text: str) -> tuple[float, float, str] | None:
    """Coordinates and a label for a place named in the question."""
    lowered = str(text or "").lower()
    for name in sorted(PLACES, key=len, reverse=True):
        if re.search(rf"\b{re.escape(name)}\b", lowered):
            latitude, longitude, label = PLACES[name]
            return latitude, longitude, label
    return None


def coordinates_from_text(text: str) -> tuple[float, float] | None:
    """Coordinates written out, with the N/S/E/W suffixes people actually type."""
    working = str(text or "")
    match = re.search(
        r"(-?\d{1,2}(?:\.\d+)?)\s*(?:deg\s*)?([NS])?\s*[, ]\s*"
        r"(-?\d{1,3}(?:\.\d+)?)\s*(?:deg\s*)?([EW])?", working, re.IGNORECASE)
    if not match:
        return None
    latitude = float(match.group(1))
    longitude = float(match.group(3))
    if (match.group(2) or "").upper() == "S":
        latitude = -latitude
    if (match.group(4) or "").upper() == "W":
        longitude = -longitude
    if not (-90.0 <= latitude <= 90.0 and -180.0 <= longitude <= 180.0):
        return None
    return latitude, longitude


def parse_init(init: str) -> datetime.datetime | None:
    """`init` is YYYYMMDDHH in UTC, which is not a format datetime will parse."""
    text = str(init or "").strip()
    if len(text) != 10 or not text.isdigit():
        return None
    try:
        return datetime.datetime(int(text[0:4]), int(text[4:6]), int(text[6:8]),
                                 int(text[8:10]), tzinfo=datetime.timezone.utc)
    except ValueError:
        return None


def describe_cloud(value) -> str:
    """What a cloud cover index means. Bigger is better here, which is the trap."""
    try:
        return CLOUD_SCALE.get(int(value), "not reported")
    except (TypeError, ValueError):
        return "not reported"


def describe_seeing(value) -> str:
    try:
        return SEEING_SCALE.get(int(value), "not reported")
    except (TypeError, ValueError):
        return "not reported"


def describe_transparency(value) -> str:
    try:
        return TRANSPARENCY_SCALE.get(int(value), "not reported")
    except (TypeError, ValueError):
        return "not reported"


def precipitation(prec_type) -> str:
    """7Timer's precipitation word, or the honest 'not reported'."""
    text = str(prec_type or "").strip()
    if not text or text.lower() == "none":
        return "none forecast"
    return text


class StargazingData:
    """7Timer's astronomical forecast, read into dated slots."""

    def __init__(self, fetch=None, cache_ttl: float = 1800.0, timeout: float = 30.0,
                 user_agent: str | None = None) -> None:
        self.cache_ttl = float(os.environ.get("STARGAZING_CACHE_TTL", cache_ttl))
        self.timeout = float(os.environ.get("STARGAZING_HTTP_TIMEOUT", timeout))
        self.user_agent = (user_agent or os.environ.get("STARGAZING_USER_AGENT")
                           or DEFAULT_USER_AGENT)
        self._fetch = fetch or self._http_json
        self._cache: dict[str, tuple[float, object]] = {}

    # -- transport ---------------------------------------------------------

    def _http_json(self, url: str, params: dict | None = None) -> str:
        query = f"{url}?{parse.urlencode(params, doseq=True)}" if params else url
        req = request.Request(query, headers={"User-Agent": self.user_agent, "Accept": "*/*"})
        try:
            with request.urlopen(req, timeout=self.timeout) as resp:
                return resp.read().decode("utf-8", "replace")
        except HTTPError as exc:
            raise StargazingNotFound(f"request failed: {exc}") from exc
        except Exception as exc:  # urllib raises many other types too
            raise StargazingError(f"request failed: {exc}") from exc

    # -- reads -------------------------------------------------------------

    def forecast(self, latitude: float, longitude: float) -> dict:
        """The whole 72-hour run of slots for a point, oldest first."""
        if not (-90.0 <= float(latitude) <= 90.0 and -180.0 <= float(longitude) <= 180.0):
            raise ValueError(f"{latitude}, {longitude} is not a point on Earth")
        params = {"lon": f"{float(longitude):.4f}", "lat": f"{float(latitude):.4f}",
                  "product": "astro", "output": "json"}
        key = f"{ASTRO_URL}?{parse.urlencode(params, doseq=True)}"
        now = time.time()
        hit = self._cache.get(key)
        if hit and hit[0] > now:
            return hit[1]
        payload = self._fetch(ASTRO_URL, params)
        if isinstance(payload, (str, bytes)):
            try:
                payload = json.loads(payload)
            except ValueError as exc:
                raise StargazingError(
                    f"7Timer returned something that is not JSON: {exc}") from exc
        if not isinstance(payload, dict):
            raise StargazingError("7Timer returned an unexpected payload")
        if str(payload.get("error") or "").strip():
            raise StargazingNotFound(f"7Timer refused the request: {payload['error']}")

        started = parse_init(payload.get("init"))
        series = payload.get("dataseries")
        if not isinstance(series, list) or not series:
            raise StargazingNotFound(
                f"7Timer has no astronomical forecast for {float(latitude):.4f}, "
                f"{float(longitude):.4f}")

        rows = []
        for entry in series:
            if not isinstance(entry, dict):
                continue
            hours = entry.get("timepoint")
            try:
                offset = int(hours)
            except (TypeError, ValueError):
                continue
            moment = (started + datetime.timedelta(hours=offset)) if started else None
            wind = entry.get("wind10m") or {}
            rows.append({
                "timepoint": offset,
                "utc": moment.isoformat().replace("+00:00", "Z") if moment else None,
                "cloudcover": entry.get("cloudcover"),
                "seeing": entry.get("seeing"),
                "transparency": entry.get("transparency"),
                "lifted_index": entry.get("lifted_index"),
                "temperature_c": entry.get("temp2m"),
                "humidity": entry.get("rh2m"),
                "wind_direction": wind.get("direction"),
                "wind_speed": wind.get("speed"),
                "precipitation": precipitation(entry.get("prec_type")),
            })
        if not rows:
            raise StargazingNotFound(
                f"7Timer sent no usable slot for {float(latitude):.4f}, "
                f"{float(longitude):.4f}")
        rows.sort(key=lambda row: row["timepoint"])

        first, last = rows[0], rows[-1]
        result = {"latitude": float(latitude), "longitude": float(longitude),
                  "product": payload.get("product") or "astro",
                  "init": payload.get("init"), "started_utc": started.isoformat()
                  if started else None,
                  "slots": rows, "count": len(rows),
                  "horizon_hours": last["timepoint"],
                  "slot_hours": SLOT_HOURS,
                  "covers_moon": False,
                  "source": DATASET}
        self._cache[key] = (now + self.cache_ttl, result)
        return result
