"""Two-line orbital elements for the satellites in orbit, keyless, from Celestrak.

Verified live on 2026-09-28:

  .../NORAD/elements/gp.php?GROUP=stations&FORMAT=json
      -> HTTP 200, 22 objects
      -> ISS (ZARYA): NORAD_CAT_ID 25544, EPOCH '2026-09-28T11:09:16.121952',
         MEAN_MOTION 15.48680135, ECCENTRICITY 0.00071596, INCLINATION 51.6312,
         RA_OF_ASC_NODE 148.9632, ARG_OF_PERICENTER 198.226, MEAN_ANOMALY 161.8473,
         BSTAR 0.00011847787, MEAN_MOTION_DOT 6.013e-05, MEAN_MOTION_DDOT 0
  .../NORAD/elements/gp.php?CATNR=25544&FORMAT=json  -> HTTP 200, 1 object
  .../NORAD/elements/gp.php?NAME=ISS&FORMAT=json      -> HTTP 200, 17 objects
      (the ISS is tracked as separate elements per module: UME, UME-2, ZARYA,
      UNITY, ZVEZDA, ... so a name search returns a whole station, not one satellite)
  .../NORAD/elements/gp.php?CATNR=25544&FORMAT=tle    -> HTTP 200, 3 lines

Two things the payloads make plain and this reader keeps. **MEAN_MOTION is in
revolutions per day, not radians per second**, so turning it into an altitude means
converting units first: 15.4868 rev/day is 0.0011262 rad/s, which puts the ISS at a
semi-major axis near 6798 km and about 427 km up. And **an epoch is a moment, not a
promise**: an element set hours old still describes the orbit roughly, and a week-old
one no longer describes where the satellite is, so every answer says how old it is.

This module reports the elements and the geometry that follows from them. It does not
propagate an orbit: a next-pass time needs an SGP4 propagator, and inventing one here
would be a made-up answer.
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

ELEMENTS_URL = "https://celestrak.org/NORAD/elements/gp.php"

DATASET = "Celestrak GP two-line elements (celestrak.org)"

DEFAULT_USER_AGENT = "awesome-acps-satellites/1.0 (+https://github.com/mrfentmen/awesome-acps)"

#: WGS-84 standard gravitational parameter, km^3/s^2. Earth's mu, published.
EARTH_MU = 398600.4418

#: Mean equatorial radius, km. Altitude is the semi-major axis minus this.
EARTH_RADIUS_KM = 6371.0

#: The groups this agent reads. Celestrak publishes more, but these are the ones that
#: actually answer with element sets: checked live on 2026-09-28, where an unknown
#: group such as `communication` or `gps` comes back as HTTP 200 with the plain text
#: `Invalid query: "GROUP=communication&FORMAT=json" (GROUP=communication not found)`
#: rather than as an error status. So the list here is the list that works.
GROUPS = ("stations", "visual", "science", "weather", "amateur", "cubesat", "geo")

#: Words a person uses for a group, mapped onto Celestrak's own name for it.
GROUP_ALIASES = {"geostationary": "geo", "geostationary orbit": "geo",
                 "comms": "stations", "communications": "stations",
                 "navigation": "stations", "gps": "stations", "glonass": "stations",
                 "galileo": "stations", "beidou": "stations", "molniya": "stations",
                 "iridium": "stations", "starlink": "stations", "spire": "stations",
                 "cubesats": "cubesat", "cube sat": "cubesat", "noaa": "weather",
                 "goes": "weather", "himawari": "weather", "scientific": "science"}

#: The group a station list comes from when nothing else is asked for.
GROUP_STATIONS = "stations"


def canonical_group(value: str | None) -> str:
    """A Celestrak group name, or ValueError for one Celestrak does not publish.

    Naming a group that does not exist is an error rather than a silent fallback to
    the station list: the caller asked about something specific.
    """
    text = str(value or GROUP_STATIONS).strip().lower()
    text = GROUP_ALIASES.get(text, text)
    if text not in GROUPS:
        raise ValueError(f"Celestrak publishes no {text!r} group; it has "
                         f"{'/'.join(GROUPS)}")
    return text


class SatelliteError(RuntimeError):
    """Celestrak could not be read."""


class SatelliteNotFound(SatelliteError):
    """Celestrak answered, and holds no such element set - a real 'nothing here'."""


def number(value, default=None):
    """Celestrak publishes numbers as JSON numbers *and* as strings; take either."""
    if value is None or value == "":
        return default
    try:
        result = float(value)
    except (TypeError, ValueError):
        return default
    return default if math.isnan(result) or math.isinf(result) else result


def semi_major_axis_km(mean_motion_revs_per_day) -> float | None:
    """Orbit size from mean motion, via Kepler's third law.

    MEAN_MOTION arrives in revolutions per day. Converted to radians per second,
    a = (mu / n^2)^(1/3). For the ISS's 15.4868 rev/day this gives 6798 km, which is
    the right answer for a station in low Earth orbit.
    """
    revs = number(mean_motion_revs_per_day)
    if not revs or revs <= 0:
        return None
    radians_per_second = revs * 2.0 * math.pi / 86400.0
    return (EARTH_MU / (radians_per_second * radians_per_second)) ** (1.0 / 3.0)


def period_minutes(mean_motion_revs_per_day) -> float | None:
    """Orbit period in minutes: 1440 divided by revolutions per day."""
    revs = number(mean_motion_revs_per_day)
    if not revs or revs <= 0:
        return None
    return 1440.0 / revs


def altitude_km(mean_motion_revs_per_day) -> float | None:
    """Mean altitude above the surface, in km."""
    axis = semi_major_axis_km(mean_motion_revs_per_day)
    return None if axis is None else axis - EARTH_RADIUS_KM


def epoch_age_hours(epoch: str | None, now: datetime.datetime | None = None) -> float | None:
    """How old an element set is, in hours. Negative means the epoch is in the future."""
    parsed = parse_epoch(epoch)
    if parsed is None:
        return None
    moment = now or datetime.datetime.now(datetime.timezone.utc)
    return (moment - parsed).total_seconds() / 3600.0


def parse_epoch(epoch: str | None) -> datetime.datetime | None:
    """Celestrak's ISO epoch, as an aware UTC datetime."""
    text = str(epoch or "").strip()
    if not text:
        return None
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        parsed = datetime.datetime.fromisoformat(text)
    except ValueError:
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=datetime.timezone.utc)


def object_id_from_text(text: str) -> str | None:
    """A NORAD catalogue number, or a COSPAR international designator like 1998-067A."""
    working = str(text or "")
    designator = re.search(r"\b(\d{4}-\d{3}[A-Z]{1,3})\b", working.upper())
    if designator:
        return designator.group(1)
    number_match = re.search(r"\b(?:cat|catalog|catnr|norad)\s*(?:id\s*|number\s*|nr\s*|#\s*)?(\d{1,6})\b",
                              working, re.IGNORECASE)
    if number_match:
        return number_match.group(1)
    return None


class SatelliteData:
    """Celestrak's element sets, read as plain numbers."""

    def __init__(self, fetch=None, cache_ttl: float = 600.0, timeout: float = 30.0,
                 user_agent: str | None = None) -> None:
        self.cache_ttl = float(os.environ.get("SATELLITES_CACHE_TTL", cache_ttl))
        self.timeout = float(os.environ.get("SATELLITES_HTTP_TIMEOUT", timeout))
        self.user_agent = (user_agent or os.environ.get("SATELLITES_USER_AGENT")
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
            raise SatelliteNotFound(f"request failed: {exc}") from exc
        except Exception as exc:  # urllib raises many other types too
            raise SatelliteError(f"request failed: {exc}") from exc

    def _elements(self, params: dict, ttl: float | None = None) -> list[dict]:
        query = dict(params)
        query["FORMAT"] = "json"
        key = f"{ELEMENTS_URL}?{parse.urlencode(query, doseq=True)}"
        now = time.time()
        hit = self._cache.get(key)
        if hit and hit[0] > now:
            return hit[1]
        payload = self._fetch(ELEMENTS_URL, query)
        if isinstance(payload, (str, bytes)):
            text = payload.decode("utf-8", "replace") if isinstance(payload, bytes) else payload
            if text.lstrip().lower().startswith("invalid query"):
                # An unknown group is HTTP 200 with this sentence, not an error status.
                raise SatelliteNotFound(text.strip()[:200])
            try:
                payload = json.loads(text)
            except ValueError as exc:
                raise SatelliteError(
                    f"Celestrak returned something that is not JSON: {exc}") from exc
        if isinstance(payload, dict):
            # Celestrak answers an unknown catalogue number with a message object.
            raise SatelliteNotFound(str(payload.get("error") or "Celestrak refused the request"))
        if not isinstance(payload, list):
            raise SatelliteError("Celestrak returned an unexpected payload")
        rows = [self._row(entry) for entry in payload if isinstance(entry, dict)]
        rows = [row for row in rows if row]
        self._cache[key] = (now + (self.cache_ttl if ttl is None else ttl), rows)
        return rows

    # -- reads -------------------------------------------------------------

    def stations(self, group: str = GROUP_STATIONS) -> dict:
        """Every element set in a group, newest epoch first."""
        name = canonical_group(group)
        rows = self._elements({"GROUP": name}, ttl=300.0)
        if not rows:
            raise SatelliteNotFound(f"Celestrak's {name!r} group is empty right now")
        rows.sort(key=lambda row: row["name"])
        ages = [row["epoch_age_hours"] for row in rows if row["epoch_age_hours"] is not None]
        return {"group": name, "rows": rows, "count": len(rows),
                "newest_hours": min(ages) if ages else None,
                "oldest_hours": max(ages) if ages else None,
                "source": DATASET}

    def lookup(self, object_id: str) -> dict:
        """One element set by catalogue number or by COSPAR designator."""
        ident = str(object_id or "").strip()
        if not ident:
            raise ValueError("tell me which satellite, for example cat id 25544 or 1998-067A")
        field = "CATNR" if ident.isdigit() else "INTDES"
        rows = self._elements({field: ident}, ttl=300.0)
        if not rows:
            raise SatelliteNotFound(f"Celestrak holds no element set for {ident!r}")
        return rows[0]

    def by_name(self, name: str) -> dict:
        """Every element set whose name matches, which for a station is its whole stack."""
        text = str(name or "").strip()
        if not text:
            raise ValueError("tell me the satellite's name, for example ISS")
        rows = self._elements({"NAME": text}, ttl=300.0)
        if not rows:
            raise SatelliteNotFound(f"Celestrak holds no element set named {text!r}")
        rows.sort(key=lambda row: row["name"])
        return {"query": text, "rows": rows, "count": len(rows), "source": DATASET}

    def tle(self, object_id: str) -> dict:
        """The raw two lines, for pasting into something else."""
        ident = str(object_id or "").strip()
        if not ident:
            raise ValueError("tell me which satellite, for example cat id 25544")
        if not ident.isdigit():
            raise ValueError("a two-line element set is fetched by catalogue number, so give me "
                             "the number, for example 25544")
        params = {"CATNR": ident, "FORMAT": "tle"}
        key = f"{ELEMENTS_URL}?{parse.urlencode(params, doseq=True)}"
        now = time.time()
        hit = self._cache.get(key)
        if hit and hit[0] > now:
            return hit[1]
        payload = self._fetch(ELEMENTS_URL, params)
        if isinstance(payload, (list, dict)):
            raise SatelliteError("Celestrak answered the two-line request with JSON")
        lines = [line for line in str(payload or "").splitlines() if line.strip()]
        if not lines:
            raise SatelliteNotFound(f"Celestrak holds no two-line element set for {ident!r}")
        result = {"object_id": ident, "lines": lines, "source": DATASET}
        self._cache[key] = (now + 300.0, result)
        return result

    # -- shaping -----------------------------------------------------------

    @staticmethod
    def _row(entry: dict) -> dict | None:
        """One element set as plain numbers, with the geometry it implies."""
        name = entry.get("OBJECT_NAME")
        cat_id = entry.get("NORAD_CAT_ID")
        if not name or cat_id is None:
            return None
        mean_motion = number(entry.get("MEAN_MOTION"))
        return {
            "name": str(name).strip(),
            "cat_id": int(cat_id),
            "object_id": entry.get("OBJECT_ID"),
            "international_designator": entry.get("OBJECT_ID"),
            "epoch": entry.get("EPOCH"),
            "epoch_age_hours": epoch_age_hours(entry.get("EPOCH")),
            "mean_motion": mean_motion,
            "period_minutes": period_minutes(mean_motion),
            "altitude_km": altitude_km(mean_motion),
            "eccentricity": number(entry.get("ECCENTRICITY")),
            "inclination": number(entry.get("INCLINATION")),
            "ra_of_asc_node": number(entry.get("RA_OF_ASC_NODE")),
            "arg_of_pericenter": number(entry.get("ARG_OF_PERICENTER")),
            "mean_anomaly": number(entry.get("MEAN_ANOMALY")),
            "bstar": number(entry.get("BSTAR")),
            "mean_motion_dot": number(entry.get("MEAN_MOTION_DOT")),
            "mean_motion_ddot": number(entry.get("MEAN_MOTION_DDOT")),
            "ephemeris_type": number(entry.get("EPHEMERIS_TYPE")),
            "classification_type": entry.get("CLASSIFICATION_TYPE"),
            "element_set_no": entry.get("ELEMENT_SET_NO"),
            "rev_at_epoch": entry.get("REV_AT_EPOCH"),
        }
