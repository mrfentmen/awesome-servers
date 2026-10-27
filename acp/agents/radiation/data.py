"""Ground-level radiation readings from Safecast's volunteer sensor network, keyless.

Verified live on 2026-09-28:

  .../measurements.json?latitude=37.5&longitude=140.5&distance=200&limit=5
      -> HTTP 200, 25 rows. `limit` is ignored: the page is always 25, whatever you
         ask for, and older pages are reached with the `cursor` parameter.
      -> row: id 199052692, value 14.0, unit 'cpm', captured_at
         '2022-04-11T19:11:41.000Z', device_id 100422, latitude 37.7233303,
         longitude 140.4767968, height 145, location_name null

Three things the payloads make plain and this reader keeps. **The feed is not all
radiation**: an unfiltered page mixes units, and a real one on 2026-09-28 held
`cpm`, `status` (a device heartbeat, not a reading) and even `PM2.5 ug/m3` rows, so
anything that is not a count rate or a dose rate is dropped and the count of what was
dropped is reported rather than hidden. **There is no distance field**, only the
coordinates, so the distance from a query point is worked out here with the haversine
formula instead of being read off. And the network is **sparse and not ordered by
time**: around Fukushima (37.23, 140.36) a 200 km query returns nothing and 500 km
returns 20 rows, some of them years old, so a quiet answer is a real answer about
sensor coverage and not a failed lookup.
"""

from __future__ import annotations

import datetime
import json
import math
import os
import re
import time
from urllib import parse, request
from urllib.error import HTTPError

MEASUREMENTS_URL = "https://api.safecast.org/measurements.json"

DATASET = "Safecast measurements (api.safecast.org)"

DEFAULT_USER_AGENT = "awesome-acps-radiation/1.0 (+https://github.com/mrfentmen/awesome-acps)"

#: What the feed returns in one page. Measured, not documented: `limit=5` and
#: `limit=100` both come back with 25 rows.
PAGE_SIZE = 25

#: The units that are actually a radiation reading. Everything else on the page -
#: `status`, `PM2.5 ug/m3`, and whatever else Safecast's devices publish - is not
#: radiation, and averaging it with a count rate would be nonsense.
RADIATION_UNITS = {"cpm": "counts per minute", "cps": "counts per second",
                   "R/h": "roentgens per hour", "uSv/h": "microsieverts per hour",
                   "µSv/h": "microsieverts per hour", "nSv/h": "nanosieverts per hour",
                   "mSv/h": "millisieverts per hour", "mR/h": "milliroentgens per hour"}

#: Earth radius, km, for the haversine distance.
EARTH_RADIUS_KM = 6371.0088

#: Places an editor is likely to ask about, with the coordinates of the site itself.
PLACES = {
    "fukushima daiichi": (37.230, 140.360, "Fukushima Daiichi, Japan"),
    "fukushima daini": (37.300, 140.550, "Fukushima Daini, Japan"),
    "fukushima": (37.230, 140.360, "Fukushima Daiichi, Japan"),
    "chernobyl": (51.276, 30.223, "Chernobyl, Ukraine"),
    "three mile island": (40.180, -76.685, "Three Mile Island, Pennsylvania"),
    "palo verde": (33.362, -112.761, "Palo Verde, Arizona"),
    "new york": (40.7128, -74.0060, "New York, New York"),
    "tokyo": (35.6762, 139.6503, "Tokyo, Japan"),
    "vienna": (48.2082, 16.3738, "Vienna, Austria"),
    "san francisco": (37.7749, -122.4194, "San Francisco, California"),
    "london": (51.5074, -0.1278, "London, United Kingdom"),
    "sydney": (-33.8688, 151.2093, "Sydney, Australia"),
}


class RadiationError(RuntimeError):
    """Safecast could not be read."""


class RadiationNotFound(RadiationError):
    """Safecast answered, and has no reading there - a real 'no sensors', not a failure."""


def place_from_text(text: str) -> tuple[float, float, str] | None:
    """Coordinates and a label for a place named in the question."""
    lowered = str(text or "").lower()
    for name in sorted(PLACES, key=len, reverse=True):
        if re.search(rf"\b{re.escape(name)}\b", lowered):
            latitude, longitude, label = PLACES[name]
            return latitude, longitude, label
    return None


def coordinates_from_text(text: str) -> tuple[float, float] | None:
    """A 'lat, lon' pair written out, if that is what the question has."""
    match = re.search(r"(-?\d{1,2}(?:\.\d+)?)\s*[, ]\s*(-?\d{1,3}(?:\.\d+)?)", str(text or ""))
    if not match:
        return None
    latitude, longitude = float(match.group(1)), float(match.group(2))
    if not (-90.0 <= latitude <= 90.0 and -180.0 <= longitude <= 180.0):
        return None
    return latitude, longitude


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in km. The feed gives coordinates but no distance."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = phi2 - phi1
    d_lambda = math.radians(lon2 - lon1)
    a = (math.sin(d_phi / 2.0) ** 2
         + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2.0) ** 2)
    return 2.0 * EARTH_RADIUS_KM * math.asin(min(1.0, math.sqrt(a)))


def parse_time(value) -> datetime.datetime | None:
    """Safecast's ISO timestamp, as an aware UTC datetime."""
    text = str(value or "").strip()
    if not text:
        return None
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        parsed = datetime.datetime.fromisoformat(text)
    except ValueError:
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=datetime.timezone.utc)


class RadiationData:
    """Safecast's measurement pages, read and cleaned."""

    def __init__(self, fetch=None, cache_ttl: float = 900.0, timeout: float = 40.0,
                 user_agent: str | None = None) -> None:
        self.cache_ttl = float(os.environ.get("RADIATION_CACHE_TTL", cache_ttl))
        self.timeout = float(os.environ.get("RADIATION_HTTP_TIMEOUT", timeout))
        self.user_agent = (user_agent or os.environ.get("RADIATION_USER_AGENT")
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
            raise RadiationNotFound(f"request failed: {exc}") from exc
        except Exception as exc:  # urllib raises many other types too
            raise RadiationError(f"request failed: {exc}") from exc

    def _page(self, params: dict) -> list[dict]:
        key = f"{MEASUREMENTS_URL}?{parse.urlencode(params, doseq=True)}"
        now = time.time()
        hit = self._cache.get(key)
        if hit and hit[0] > now:
            return hit[1]
        payload = self._fetch(MEASUREMENTS_URL, params)
        if isinstance(payload, (str, bytes)):
            try:
                payload = json.loads(payload)
            except ValueError as exc:
                raise RadiationError(
                    f"Safecast returned something that is not JSON: {exc}") from exc
        if isinstance(payload, dict):
            raise RadiationError(f"Safecast returned an error: {payload.get('errors') or payload}")
        if not isinstance(payload, list):
            raise RadiationError("Safecast returned an unexpected payload")
        self._cache[key] = (now + self.cache_ttl, payload)
        return payload

    # -- reads -------------------------------------------------------------

    def near(self, latitude: float, longitude: float, radius_km: float = 100.0,
             pages: int = 1) -> dict:
        """Radiation readings around a point, nearest first, with the distance worked out.

        Safecast's `distance` filter is strict, so a page can come back empty for a
        populated area. The rows are re-checked here against the radius, and rows on
        other units are counted and dropped rather than averaged in.
        """
        if not (-90.0 <= float(latitude) <= 90.0 and -180.0 <= float(longitude) <= 180.0):
            raise ValueError(f"{latitude}, {longitude} is not a point on Earth")
        wanted = max(1.0, min(float(radius_km), 2000.0))
        params: dict = {"latitude": f"{float(latitude):.4f}",
                        "longitude": f"{float(longitude):.4f}",
                        "distance": f"{wanted:.0f}"}
        rows, skipped, seen = [], 0, 0
        for index in range(max(1, min(int(pages), 10))):
            if index:
                params["cursor"] = str(seen)
            page = self._page(params)
            if not page:
                break
            seen += len(page)
            for raw in page:
                if not isinstance(raw, dict):
                    continue
                unit = str(raw.get("unit") or "")
                if unit not in RADIATION_UNITS:
                    skipped += 1
                    continue
                try:
                    value = float(raw.get("value"))
                except (TypeError, ValueError):
                    skipped += 1
                    continue
                row_lat, row_lon = raw.get("latitude"), raw.get("longitude")
                if row_lat is None or row_lon is None:
                    skipped += 1
                    continue
                rows.append({
                    "id": raw.get("id"),
                    "value": value,
                    "unit": unit,
                    "captured_at": raw.get("captured_at"),
                    "device_id": raw.get("device_id"),
                    "location_name": raw.get("location_name"),
                    "height": raw.get("height"),
                    "devicetype": raw.get("devicetype_id"),
                    "latitude": float(row_lat),
                    "longitude": float(row_lon),
                    "distance_km": haversine_km(float(latitude), float(longitude),
                                                float(row_lat), float(row_lon)),
                })
            if len(page) < PAGE_SIZE:
                break
        if not rows:
            raise RadiationNotFound(
                f"Safecast has no radiation reading within {wanted:.0f} km of "
                f"{float(latitude):.4f}, {float(longitude):.4f}"
                + (f" ({seen} row(s) came back, all on other units such as a device "
                   f"status or an air-quality reading)" if seen else ""))
        rows.sort(key=lambda row: (row["distance_km"], row["captured_at"] or ""))
        for row in rows:
            row["inside_radius"] = row["distance_km"] <= wanted
        return {"latitude": float(latitude), "longitude": float(longitude),
                "radius_km": wanted, "rows": rows,
                "inside": [row for row in rows if row["inside_radius"]],
                "rows_seen": seen, "skipped_other_units": skipped,
                "pages_read": min(max(1, int(pages)), 10),
                "newest": max((row["captured_at"] or "" for row in rows), default=""),
                "oldest": min((row["captured_at"] or "" for row in rows), default=""),
                "source": DATASET}

    def window(self, latitude: float, longitude: float, radius_km: float = 100.0,
               days: int = 30, pages: int = 10) -> dict:
        """Readings around a point inside a time window, summarised.

        Safecast filters by distance and not by time on this endpoint, so the date
        window is applied here, to the timestamps it did send. The page count is
        capped and the total reported, because 'the highest reading in a month' is
        only as complete as the pages that were read.
        """
        if not (-90.0 <= float(latitude) <= 90.0 and -180.0 <= float(longitude) <= 180.0):
            raise ValueError(f"{latitude}, {longitude} is not a point on Earth")
        wanted = max(1.0, min(float(radius_km), 2000.0))
        span = max(1, min(int(days), 3650))
        cutoff = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=span)
        params: dict = {"latitude": f"{float(latitude):.4f}",
                        "longitude": f"{float(longitude):.4f}",
                        "distance": f"{wanted:.0f}"}
        rows, skipped, seen = [], 0, 0
        for index in range(max(1, min(int(pages), 20))):
            if index:
                params["cursor"] = str(seen)
            page = self._page(params)
            if not page:
                break
            seen += len(page)
            for raw in page:
                if not isinstance(raw, dict):
                    continue
                if str(raw.get("unit") or "") not in RADIATION_UNITS:
                    skipped += 1
                    continue
                try:
                    value = float(raw.get("value"))
                except (TypeError, ValueError):
                    skipped += 1
                    continue
                moment = parse_time(raw.get("captured_at"))
                if moment is None or moment < cutoff:
                    continue
                row_lat, row_lon = raw.get("latitude"), raw.get("longitude")
                if row_lat is None or row_lon is None:
                    continue
                rows.append({
                    "id": raw.get("id"), "value": value, "unit": str(raw.get("unit")),
                    "captured_at": raw.get("captured_at"),
                    "device_id": raw.get("device_id"),
                    "location_name": raw.get("location_name"),
                    "latitude": float(row_lat), "longitude": float(row_lon),
                    "distance_km": haversine_km(float(latitude), float(longitude),
                                                float(row_lat), float(row_lon)),
                })
            if len(page) < PAGE_SIZE:
                break
        if not rows:
            raise RadiationNotFound(
                f"Safecast has no radiation reading within {wanted:.0f} km of "
                f"{float(latitude):.4f}, {float(longitude):.4f} in the last {span} day(s)")

        #: One unit for the summary, exactly as for a device: a count rate and a dose
        #: rate are not comparable, so they are counted separately rather than averaged.
        by_unit: dict[str, list[float]] = {}
        unit_devices: dict[str, set] = {}
        for row in rows:
            by_unit.setdefault(row["unit"], []).append(row["value"])
            if row["device_id"]:
                unit_devices.setdefault(row["unit"], set()).add(row["device_id"])
        unit = max(by_unit, key=lambda name: (len(by_unit[name]), name))
        values = sorted(by_unit[unit])
        rows.sort(key=lambda row: row["value"], reverse=True)
        highest = rows[0]
        return {"latitude": float(latitude), "longitude": float(longitude),
                "radius_km": wanted, "days": span, "rows": rows,
                "readings": len(rows), "unit": unit,
                "by_unit": {name: len(items) for name, items in by_unit.items()},
                "high": values[-1], "low": values[0],
                "median": (values[len(values) // 2] if len(values) % 2
                           else (values[len(values) // 2 - 1] + values[len(values) // 2]) / 2),
                "highest_row": highest,
                "rows_seen": seen, "skipped_other_units": skipped,
                "truncated": seen >= PAGE_SIZE * max(1, min(int(pages), 20)),
                #: Counted over the summarised unit only, so the device count describes
                #: the same rows as the high and the low.
                "devices": len(unit_devices.get(unit, ())),
                "source": DATASET}

    def device(self, device_id: str, pages: int = 1) -> dict:
        """Every reading from one device, oldest first, for a single sensor's history."""
        ident = str(device_id or "").strip()
        if not ident.isdigit():
            raise ValueError("a Safecast device id is a number, for example 100422")
        rows, skipped, seen = [], 0, 0
        params: dict = {"device_id": ident}
        for index in range(max(1, min(int(pages), 10))):
            if index:
                params["cursor"] = str(seen)
            page = self._page(params)
            if not page:
                break
            seen += len(page)
            for raw in page:
                if not isinstance(raw, dict):
                    continue
                unit = str(raw.get("unit") or "")
                if unit not in RADIATION_UNITS:
                    skipped += 1
                    continue
                try:
                    value = float(raw.get("value"))
                except (TypeError, ValueError):
                    skipped += 1
                    continue
                rows.append({"id": raw.get("id"), "value": value, "unit": unit,
                             "captured_at": raw.get("captured_at"),
                             "latitude": raw.get("latitude"),
                             "longitude": raw.get("longitude"),
                             "location_name": raw.get("location_name")})
            if len(page) < PAGE_SIZE:
                break
        if not rows:
            raise RadiationNotFound(
                f"Safecast has no radiation reading from device {ident}"
                + (f" ({seen} row(s) came back, all on other units)" if seen else ""))
        rows.sort(key=lambda row: row["captured_at"] or "")

        #: A device can publish more than one unit over its life, and a count rate and
        #: a dose rate are not comparable, so every summary is computed over one unit
        #: and the others are counted separately. Averaging 14 cpm with 0.09 uSv/h
        #: would be a made-up number.
        by_unit: dict[str, int] = {}
        for row in rows:
            by_unit[row["unit"]] = by_unit.get(row["unit"], 0) + 1
        primary = max(by_unit, key=lambda name: (by_unit[name], name == rows[-1]["unit"]))
        values = [row["value"] for row in rows if row["unit"] == primary]
        return {"device_id": int(ident), "rows": rows, "readings": len(rows),
                "readings_in_unit": len(values),
                "rows_seen": seen, "skipped_other_units": skipped,
                "unit": primary, "by_unit": by_unit,
                "min": min(values), "max": max(values),
                "mean": sum(values) / len(values),
                "newest": rows[-1]["captured_at"], "oldest": rows[0]["captured_at"],
                "source": DATASET}
