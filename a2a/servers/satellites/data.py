"""Read-only client for CelesTrak's GP element sets and SATCAT records.

Endpoints (keyless, verified live 2026-09-28):
  - /NORAD/elements/gp.php?GROUP=<group>&FORMAT=json    element sets for a group
  - /NORAD/elements/gp.php?CATNR=<norad id>&FORMAT=json  one satellite's element set
  - /NORAD/elements/gp.php?NAME=<name>&FORMAT=json      element sets by name
  - /satcat/records.php?GROUP=<group>&FORMAT=json       the space catalogue

Two CelesTrak habits shape this client:

1. It throttles bursts. A burst of calls earns a 403, which is rate limiting
   rather than a dead feed, so the group lists are cached for minutes and the
   SATCAT catalogue, which changes only on launch, for a day.
2. `NAME=` is a substring match, so "ISS" returns the ISS modules and also
   UME (ISS) and AISSAT 1. Nothing here guesses which one was meant: an
   ambiguous name comes back as candidates to choose from.

Orbit propagation
-----------------
`propagate` is the two-body Kepler problem plus the secular J2 rates for the
node and the argument of perigee. That is SGP4 with the short-period J2 terms,
the drag model and the deep-space terms left out, and the difference matters:
it is good to a few tens of km over about a day and drifts as the element set
ages, so every answer that uses it says how old the element set was. A pass time
near a day-old element set is a planning aid, not a schedule.

It is verified two ways. The geometry passes analytic invariants (a circular
equatorial orbit comes back with the right right ascension at every quarter
period, and an inclination of +51.6 degrees puts the sub-point at +51.6 degrees
declination at argument of latitude 90 degrees), and the licence gateway runs
the same arithmetic for the premium skill, so the two implementations are
asserted to agree to under a kilometre.
"""

from __future__ import annotations

import math
import os
import re
from datetime import datetime, timedelta, timezone

from a2a_kit import JsonApiClient, UpstreamError, utc_now_iso

BASE_URL = "https://celestrak.org"
GP_PATH = "/NORAD/elements/gp.php"
SATCAT_PATH = "/satcat/records.php"

DATASET = "celestrak.org/NORAD/elements/gp.php"
SATCAT_DATASET = "celestrak.org/satcat/records.php"
PRODUCT = "CelesTrak GP element sets and SATCAT space catalogue"

#: Groups this client will read. Bounded so one call cannot pull the whole
#: catalogue; the rest of CelesTrak's group list is deliberately not exposed.
GROUPS = (
    "stations", "visual", "active", "weather", "noaa", "goes", "resource",
    "sarsat", "dmc", "planet", "spire", "geo", "science", "geodetic",
    "engineering", "cubesat", "other",
)

#: The field set this server reports, in the order it reports them.
ELEMENT_FIELDS = (
    "object_name", "norad_cat_id", "object_id", "international_designator",
    "epoch", "mean_motion_rev_per_day", "eccentricity", "inclination_deg",
    "ra_of_asc_node_deg", "arg_of_pericenter_deg", "mean_anomaly_deg",
    "bstar", "classification_type",
)
CATALOG_FIELDS = (
    "object_name", "norad_cat_id", "object_id", "object_type", "ops_status_code",
    "owner", "launch_date", "launch_site", "decay_date", "period_minutes",
    "inclination_deg", "apogee_km", "perigee_km", "orbit_type", "orbit_center",
)

#: CelesTrak publishes UPPER_CASE keys; the answers report snake_case, so the
#: rename is declared once here rather than sprinkled through the readers.
ELEMENT_KEYS = {
    "OBJECT_NAME": "object_name",
    "NORAD_CAT_ID": "norad_cat_id",
    "OBJECT_ID": "object_id",
    "INTERNATIONAL_DESIGNATOR": "international_designator",
    "EPOCH": "epoch",
    "MEAN_MOTION": "mean_motion_rev_per_day",
    "ECCENTRICITY": "eccentricity",
    "INCLINATION": "inclination_deg",
    "RA_OF_ASC_NODE": "ra_of_asc_node_deg",
    "ARG_OF_PERICENTER": "arg_of_pericenter_deg",
    "MEAN_ANOMALY": "mean_anomaly_deg",
    "BSTAR": "bstar",
    "CLASSIFICATION_TYPE": "classification_type",
}
CATALOG_KEYS = {
    "OBJECT_NAME": "object_name",
    "NORAD_CAT_ID": "norad_cat_id",
    "OBJECT_ID": "object_id",
    "OBJECT_TYPE": "object_type",
    "OPS_STATUS_CODE": "ops_status_code",
    "OWNER": "owner",
    "LAUNCH_DATE": "launch_date",
    "LAUNCH_SITE": "launch_site",
    "DECAY_DATE": "decay_date",
    "PERIOD": "period_minutes",
    "INCLINATION": "inclination_deg",
    "APOGEE": "apogee_km",
    "PERIGEE": "perigee_km",
    "ORBIT_TYPE": "orbit_type",
    "ORBIT_CENTER": "orbit_center",
}

#: Derived quantities reported alongside the raw elements.
PERIOD_MINUTES = "period_minutes"
PERIGEE_KM = "perigee_km"
APOGEE_KM = "apogee_km"
ALTITUDE_KM = "altitude_km"

# -- propagation constants (WGS-72 fit, as the published TLEs assume) --------
MU = 398600.5                 # km^3 / s^2
R_EARTH_KM = 6378.135
J2 = 1.082616e-3
DEG = math.pi / 180.0
UNIX_EPOCH_JD = 2440587.5
DAY_SECONDS = 86400.0
#: A pass sweep samples this often. 20 s is about 7 km of along-track motion,
#: which is finer than the propagation error at these element-set ages.
SWEEP_STEP_SECONDS = 20
#: A group sweep propagates every satellite across the whole window, so it is
#: bounded. The answer reports how many objects were covered.
MAX_GROUP_SATELLITES = 30

_POINT_RE = re.compile(r"^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$")
_CATNR_RE = re.compile(r"^\d{1,6}$")
_NAME_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9 .,'()\-+/]{1,70}$")
_ISO_RE = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}")

__all__ = [
    "ALTITUDE_KM",
    "APOGEE_KM",
    "BASE_URL",
    "CATALOG_FIELDS",
    "CelesTrakClient",
    "DATASET",
    "ELEMENT_FIELDS",
    "GROUPS",
    "GP_PATH",
    "J2",
    "MAX_GROUP_SATELLITES",
    "MU",
    "PERIOD_MINUTES",
    "PERIGEE_KM",
    "PRODUCT",
    "R_EARTH_KM",
    "SATCAT_DATASET",
    "SATCAT_PATH",
    "SWEEP_STEP_SECONDS",
    "UpstreamError",
    "gmst",
    "haversine_km",
    "julian_date",
    "look_angles",
    "prepare",
    "propagate",
    "propagate_prepared",
    "subpoint",
]


def _is_not_found(exc: Exception) -> bool:
    """True when the failure was an HTTP 404 rather than a real outage."""
    from urllib import error as urlerror

    cause = exc.__cause__
    return isinstance(cause, urlerror.HTTPError) and cause.code == 404


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in kilometres."""
    radius = 6371.0088
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = (math.sin(delta_phi / 2) ** 2
         + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2)
    return 2 * radius * math.asin(math.sqrt(a))


def julian_date(moment: datetime) -> float:
    """A UTC datetime as a Julian date. No calendar arithmetic, no off-by-one days."""
    if moment.tzinfo is None:
        moment = moment.replace(tzinfo=timezone.utc)
    return UNIX_EPOCH_JD + moment.timestamp() / DAY_SECONDS


def gmst(jd: float) -> float:
    """Greenwich mean sidereal time in radians. Checked: 280.4606 deg at J2000.0."""
    t = (jd - 2451545.0) / 36525.0
    seconds = (-6.2e-6 * t ** 3 + 0.093104 * t ** 2
               + (876600.0 * 3600 + 8640184.812866) * t + 67310.54841)
    return math.fmod(seconds / 240.0, 360.0) * DEG


def _kepler(mean_anomaly: float, eccentricity: float) -> float:
    """Kepler's equation: eccentric anomaly from mean anomaly, by Newton iteration."""
    ea = mean_anomaly
    for _ in range(12):
        step = (ea - eccentricity * math.sin(ea) - mean_anomaly) / (1.0 - eccentricity * math.cos(ea))
        ea -= step
        if abs(step) < 1e-13:
            break
    return ea


def element_set_n(name: str) -> float:
    """Secular J2 rate factor, 1.5 J2 Re^2 sqrt(mu) / a^3.5, in radians per second."""
    return 1.5 * J2 * R_EARTH_KM ** 2 * math.sqrt(MU) / name ** 3.5


def prepare(elements: dict) -> dict:
    """Read a CelesTrak element set once, into the numbers the model needs.

    A pass sweep propagates the same element set thousands of times, so parsing
    the epoch and deriving the semi-major axis on every call made the sweep
    twenty times slower than the arithmetic. Callers that sweep once per
    satellite hold on to this; `propagate` is the one-shot wrapper.
    """
    try:
        mean_motion = float(elements["MEAN_MOTION"]) * 2.0 * math.pi / 86400.0
        eccentricity = float(elements.get("ECCENTRICITY") or 0.0)
        inclination = float(elements["INCLINATION"]) * DEG
        nodeo = float(elements["RA_OF_ASC_NODE"]) * DEG
        argpo = float(elements["ARG_OF_PERICENTER"]) * DEG
        mean_anomaly = float(elements["MEAN_ANOMALY"]) * DEG
    except (KeyError, TypeError, ValueError) as exc:
        raise UpstreamError("CelesTrak element set is missing or unreadable") from exc
    if not mean_motion > 0:
        raise UpstreamError("CelesTrak element set has a non-positive mean motion")
    epoch = parse_epoch(elements.get("EPOCH"))
    if epoch is None:
        raise UpstreamError("CelesTrak element set has no usable epoch")
    semi_major = (MU / mean_motion ** 2) ** (1.0 / 3.0)
    return {
        "mean_motion": mean_motion,
        "eccentricity": eccentricity,
        "inclination": inclination,
        "nodeo": nodeo,
        "argpo": argpo,
        "mean_anomaly": mean_anomaly,
        "epoch": epoch,
        "semi_major": semi_major,
        "k": element_set_n(semi_major),
        "sqrt_one_minus_e2": math.sqrt(max(0.0, 1.0 - eccentricity * eccentricity)),
    }


def propagate_prepared(orbit: dict, jd: float) -> dict:
    """Where a prepared element set puts a satellite at one instant.

    Two-body Kepler plus the secular J2 rates for the node and the argument of
    perigee. Returns the earth-centred inertial position in km plus the
    sub-point and the altitude, so a caller that only wants "where is it" does
    not repeat the rotation.
    """
    e = orbit["eccentricity"]
    inclination = orbit["inclination"]
    k = orbit["k"]
    dt = (jd - orbit["epoch"]) * DAY_SECONDS
    node = orbit["nodeo"] - k * math.cos(inclination) * dt
    argp = orbit["argpo"] + 0.5 * k * (5.0 * math.cos(inclination) ** 2 - 1.0) * dt
    m = (orbit["mean_anomaly"] + orbit["mean_motion"] * dt) % (2.0 * math.pi)
    ea = _kepler(m, e)
    # Half-angle relation, so the quadrant survives for a high eccentricity.
    true_anomaly = 2.0 * math.atan2(
        math.sqrt(1.0 + e) * math.sin(ea / 2.0),
        math.sqrt(1.0 - e) * math.cos(ea / 2.0),
    )
    radius = orbit["semi_major"] * (1.0 - e * math.cos(ea))
    xp = radius * math.cos(true_anomaly)
    yp = radius * math.sin(true_anomaly)

    # Perifocal -> ECI as Rz(node) . Rx(inclination) . Rz(argp), applied one
    # rotation at a time rather than as three general matrices: a pass sweep
    # calls this tens of thousands of times, and building 3x3 matrices for each
    # one dominated the whole skill. The three steps are exact rotations:
    #   Rz(argp) (xp,yp,0)   -> (u, v, 0)
    #   Rx(incl) (u,v,0)     -> (u, v cos i, v sin i)
    #   Rz(node) (x,y,z)     -> (x cos O - y sin O, x sin O + y cos O, z)
    # tests/test_agent.py checks this closed form against the matrix product.
    cos_argp, sin_argp = math.cos(argp), math.sin(argp)
    cos_node, sin_node = math.cos(node), math.sin(node)
    cos_incl, sin_incl = math.cos(inclination), math.sin(inclination)
    u = xp * cos_argp - yp * sin_argp
    v = xp * sin_argp + yp * cos_argp
    v_cos, v_sin = v * cos_incl, v * sin_incl
    x = u * cos_node - v_cos * sin_node
    y = u * sin_node + v_cos * cos_node
    z = v_sin
    distance = math.sqrt(x * x + y * y + z * z)
    return {
        "x": x, "y": y, "z": z,
        "radius": distance,
        "altitude_km": distance - R_EARTH_KM,
        "latitude": math.degrees(math.asin(z / distance)),
        "longitude": math.degrees(math.atan2(y, x)) - math.degrees(gmst(jd)),
        "semi_major_km": orbit["semi_major"],
        "mean_motion_rad_per_s": orbit["mean_motion"],
    }


def propagate(elements: dict, jd: float) -> dict:
    """Where one element set puts a satellite at one instant.

    `elements` is a CelesTrak GP row, unchanged. Sweeps should call
    `prepare` once and then `propagate_prepared`.
    """
    return propagate_prepared(prepare(elements), jd)


def subpoint(elements: dict, moment: datetime) -> dict:
    """Sub-point, altitude and orbital period for one element set at one instant."""
    position = propagate(elements, julian_date(moment))
    return {
        "time": moment.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "latitude": round(position["latitude"], 4),
        "longitude": round(((position["longitude"] + 180.0) % 360.0) - 180.0, 4),
        "altitude_km": round(position["altitude_km"], 1),
        "semi_major_km": round(position["semi_major_km"], 2),
        "period_minutes": round(2.0 * math.pi / position["mean_motion_rad_per_s"] / 60.0, 2),
    }


def look_angles(position: dict, observer_lat: float, observer_lon: float) -> dict:
    """How high a satellite looks from a point on the ground, and where.

    From the geocentric central angle psi between the observer and the sub-point:
    the slant range is the law of cosines, and sin(elevation) comes out to
    (r cos psi - R) / d, which is 1 when the satellite is overhead and goes
    negative below the horizon. Azimuth needs the full position vector, so it is
    taken in the observer's local east-north-up frame.
    """
    lat = math.radians(position["latitude"])
    lon = math.radians(position["longitude"])
    obs_lat = math.radians(observer_lat)
    obs_lon = math.radians(observer_lon)
    cos_central = (math.sin(obs_lat) * math.sin(lat)
                   + math.cos(obs_lat) * math.cos(lat) * math.cos(lon - obs_lon))
    clamped = max(-1.0, min(1.0, cos_central))
    range_km = math.sqrt(
        R_EARTH_KM ** 2 + position["radius"] ** 2 - 2.0 * R_EARTH_KM * position["radius"] * clamped
    )
    sin_elevation = (position["radius"] * clamped - R_EARTH_KM) / range_km
    elevation = math.degrees(math.asin(max(-1.0, min(1.0, sin_elevation))))
    if not math.isfinite(elevation):
        elevation = -90.0

    east = -math.sin(obs_lon) * position["x"] + math.cos(obs_lon) * position["y"]
    north = (-math.sin(obs_lat) * math.cos(obs_lon) * position["x"]
             - math.sin(obs_lat) * math.sin(obs_lon) * position["y"]
             + math.cos(obs_lat) * position["z"])
    up = (math.cos(obs_lat) * math.cos(obs_lon) * position["x"]
          + math.cos(obs_lat) * math.sin(obs_lon) * position["y"]
          + math.sin(obs_lat) * position["z"])
    if range_km <= 1e-9 or not math.isfinite(azimuth := math.degrees(math.atan2(east, north))):
        azimuth = 0.0
    return {
        "elevation_deg": round(elevation, 1),
        "azimuth_deg": round(azimuth % 360.0, 1),
        "range_km": round(range_km, 1),
        "central_angle_deg": round(math.degrees(math.acos(clamped)), 1),
        "up": round(up / R_EARTH_KM, 4),
    }


def parse_epoch(value) -> float | None:
    """CelesTrak's ISO epoch as a Julian date, or None when it is not a timestamp."""
    if not isinstance(value, str) or not _ISO_RE.match(value):
        return None
    text = value.replace("Z", "+00:00")
    # CelesTrak publishes microsecond precision; datetime keeps microseconds only.
    if "." in text:
        head, fraction = text.split(".", 1)
        text = f"{head}.{fraction[:6]:<06s}".replace(" ", "0")
    try:
        return julian_date(datetime.fromisoformat(text))
    except ValueError:
        return None


def epoch_age_hours(elements: dict) -> float | None:
    """How old the element set is, in hours, against the current moment."""
    epoch = parse_epoch(elements.get("EPOCH"))
    if epoch is None:
        return None
    return round((julian_date(datetime.now(timezone.utc)) - epoch) * 24.0, 2)


def _pass_record(opened: dict, stamp) -> dict:
    """One finished pass: the sweep tracked offsets, this turns them into times."""
    return {
        "start": stamp(opened["start"]),
        "end": stamp(opened["end"]),
        "minutes": max(1, round((opened["end"] - opened["start"]) / 60.0)),
        "max_elevation_deg": opened["max_elevation_deg"],
        "max_at": stamp(opened["max_at"]),
        "range_km": opened["range_km"],
        "azimuth_deg": opened["azimuth_deg"],
    }


def _to_float(value) -> float | None:
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


class CelesTrakClient(JsonApiClient):
    env_prefix = "SATELLITES"
    base_url = BASE_URL

    def __init__(self, fetch=None, base_url=None, cache_ttl=None, timeout=None, headers=None) -> None:
        super().__init__(fetch=fetch, base_url=base_url, cache_ttl=cache_ttl, timeout=timeout,
                         headers=headers)
        # Elements move every orbit, but a caller asking twice in a minute wants
        # one answer: a short TTL keeps CelesTrak's burst throttle happy.
        self.element_ttl = float(os.environ.get(f"{self.env_prefix}_ELEMENT_TTL", "300"))
        # The space catalogue only changes when something launches.
        self.catalog_ttl = float(os.environ.get(f"{self.env_prefix}_CATALOG_TTL", "86400"))

    # -- validation --------------------------------------------------------

    @staticmethod
    def check_group(value) -> str:
        group = str(value).strip().lower()
        if group not in GROUPS:
            raise ValueError(f"group must be one of: {', '.join(GROUPS)}")
        return group

    @staticmethod
    def check_catnr(value) -> str:
        catnr = str(value).strip()
        if not _CATNR_RE.match(catnr):
            raise ValueError("a NORAD catalogue number is 1 to 6 digits, for example 25544 (the ISS)")
        return catnr

    @staticmethod
    def check_name(value) -> str:
        name = str(value).strip()
        if not _NAME_RE.match(name):
            raise ValueError("that does not look like a satellite name")
        return name

    @staticmethod
    def check_point(point) -> tuple[float, float]:
        match = _POINT_RE.match(str(point))
        if not match:
            raise ValueError("a point is 'lat,lon', for example 40.7006,-74.0142")
        lat, lon = float(match.group(1)), float(match.group(2))
        if not -90 <= lat <= 90 or not -180 <= lon <= 180:
            raise ValueError("latitude must be -90..90 and longitude -180..180")
        return round(lat, 4), round(lon, 4)

    @staticmethod
    def check_elevation(value) -> float:
        try:
            elevation = float(value)
        except (TypeError, ValueError):
            raise ValueError("elevation must be a number of degrees") from None
        if not 0 <= elevation <= 90:
            raise ValueError("elevation must be between 0 and 90 degrees")
        return round(elevation, 1)

    @staticmethod
    def check_days(value) -> int:
        try:
            days = int(value)
        except (TypeError, ValueError):
            raise ValueError("days must be a whole number") from None
        if not 1 <= days <= 7:
            raise ValueError("days must be between 1 and 7")
        return days

    @staticmethod
    def check_limit(value) -> int:
        try:
            limit = int(value)
        except (TypeError, ValueError):
            raise ValueError("limit must be a whole number") from None
        if not 1 <= limit <= 50:
            raise ValueError("limit must be between 1 and 50")
        return limit

    @staticmethod
    def check_azimuth(value) -> float:
        try:
            azimuth = float(value)
        except (TypeError, ValueError):
            raise ValueError("azimuth must be a number of degrees") from None
        if not 0 <= azimuth <= 360:
            raise ValueError("azimuth must be between 0 and 360 degrees")
        return round(azimuth % 360.0, 1)

    # -- transport ---------------------------------------------------------

    def _elements(self, query: dict, ttl: float | None = None) -> list[dict]:
        params = {**query, "FORMAT": "json"}
        try:
            payload = self.get_json(GP_PATH, params,
                                    ttl=ttl if ttl is not None else self.element_ttl)
        except UpstreamError as exc:
            # CelesTrak answers HTTP 404 for a NAME or CATNR it does not know.
            # That is an answer rather than an outage, so it becomes an empty
            # list and the skill says "no such satellite" instead of failing.
            if _is_not_found(exc):
                return []
            raise
        if isinstance(payload, dict):
            # CelesTrak reports a miss in the body with HTTP 200.
            problem = payload.get("error") or payload.get("message")
            if problem:
                raise UpstreamError(f"CelesTrak: {problem}")
            raise UpstreamError("CelesTrak returned an unexpected element-set payload")
        if not isinstance(payload, list):
            raise UpstreamError("CelesTrak returned an unexpected element-set payload")
        return [row for row in payload if isinstance(row, dict)]

    # -- reads -------------------------------------------------------------

    def group_elements(self, group: str, limit: int = 10) -> list[dict]:
        """Element sets for a named group, largest orbit first is not attempted."""
        group = self.check_group(group)
        rows = self._elements({"GROUP": group})
        return [self.element_summary(row) for row in rows[: self.check_limit(limit)]]

    def by_catnr(self, catnr: str) -> dict | None:
        """One satellite's element set by NORAD catalogue number."""
        rows = self._elements({"CATNR": self.check_catnr(catnr)})
        return rows[0] if rows else None

    def by_name(self, name: str, limit: int = 10) -> list[dict]:
        """Element sets whose name starts with `name` (CelesTrak matches a prefix)."""
        rows = self._elements({"NAME": self.check_name(name)})
        return [self.element_summary(row) for row in rows[: self.check_limit(limit)]]

    def resolve(self, catnr: str | None = None, name: str | None = None) -> tuple[dict | None, list[dict]]:
        """One element set: by catalogue number, or by name when that is unambiguous.

        Returns `(row, candidates)`. `row` is None when the name is unknown or
        matches more than one satellite, and `candidates` then holds what did
        match so the caller can ask which one was meant.
        """
        if catnr:
            return self.by_catnr(catnr), []
        if not name:
            return None, []
        matches = self.by_name(name, limit=10)
        if len(matches) == 1:
            return self.by_catnr(str(matches[0].get("norad_cat_id"))), matches
        if matches and all(
            (row.get("object_name") or "").lower() == name.lower() for row in matches
        ):
            return self.by_catnr(str(matches[0].get("norad_cat_id"))), matches
        return None, matches

    def element_summary(self, row: dict) -> dict:
        """The reported field set plus the quantities derived from the elements."""
        summary = {name: row[upstream] for upstream, name in ELEMENT_KEYS.items() if upstream in row}
        summary["dataset"] = DATASET
        mean_motion = _to_float(row.get("MEAN_MOTION"))
        eccentricity = _to_float(row.get("ECCENTRICITY"))
        if mean_motion and mean_motion > 0:
            mean_motion_rad_s = mean_motion * 2.0 * math.pi / 86400.0
            semi_major = (MU / mean_motion_rad_s ** 2) ** (1.0 / 3.0)
            summary[PERIOD_MINUTES] = round(2.0 * math.pi / mean_motion_rad_s / 60.0, 2)
            summary["semi_major_km"] = round(semi_major, 2)
            if eccentricity is not None:
                summary[PERIGEE_KM] = round(semi_major * (1.0 - eccentricity) - R_EARTH_KM, 1)
                summary[APOGEE_KM] = round(semi_major * (1.0 + eccentricity) - R_EARTH_KM, 1)
                summary[ALTITUDE_KM] = round(summary[PERIGEE_KM], 1)
        summary["element_set_age_hours"] = epoch_age_hours(row)
        return summary

    def catalog(self, group: str | None = None, catnr: str | None = None,
                name: str | None = None, limit: int = 10) -> list[dict]:
        """SATCAT records: who owns it, when it launched, what orbit it is in."""
        query: dict = {}
        if group:
            query["GROUP"] = self.check_group(group)
        if catnr:
            query["CATNR"] = self.check_catnr(catnr)
        if name:
            query["NAME"] = self.check_name(name)
        if not query:
            raise ValueError("a catalogue lookup needs a group, a catalogue number or a name")
        params = {**query, "FORMAT": "json"}
        payload = self.get_json(SATCAT_PATH, params, ttl=self.catalog_ttl)
        if not isinstance(payload, list):
            raise UpstreamError("CelesTrak returned an unexpected catalogue payload")
        summaries = []
        for row in payload[: self.check_limit(limit)]:
            if not isinstance(row, dict):
                continue
            record = {name: row[upstream] for upstream, name in CATALOG_KEYS.items()
                      if upstream in row}
            record["dataset"] = SATCAT_DATASET
            summaries.append(record)
        return summaries

    # -- propagation-backed reads -----------------------------------------

    def overhead(self, point: str, min_elevation: float = 10.0, group: str = "stations",
                 limit: int = 10) -> list[dict]:
        """What is above a point right now, nearest first."""
        lat, lon = self.check_point(point)
        min_elevation = self.check_elevation(min_elevation)
        rows = self._elements({"GROUP": self.check_group(group)})
        now = datetime.now(timezone.utc)
        jd = julian_date(now)
        visible = []
        for row in rows:
            try:
                orbit = prepare(row)
            except UpstreamError:
                continue
            position = propagate_prepared(orbit, jd)
            angles = look_angles(position, lat, lon)
            if angles["elevation_deg"] < min_elevation:
                continue
            entry = {
                "object_name": row.get("OBJECT_NAME"),
                "norad_cat_id": row.get("NORAD_CAT_ID"),
                "object_id": row.get("OBJECT_ID"),
                "epoch": row.get("EPOCH"),
                "element_set_age_hours": epoch_age_hours(row),
                "subpoint": {"latitude": round(position["latitude"], 3),
                             "longitude": round(((position["longitude"] + 180.0) % 360.0) - 180.0, 3)},
                "altitude_km": round(position["altitude_km"], 1),
                "range_km": angles["range_km"],
                "elevation_deg": angles["elevation_deg"],
                "azimuth_deg": angles["azimuth_deg"],
                "central_angle_deg": angles["central_angle_deg"],
            }
            visible.append(entry)
        visible.sort(key=lambda row: -row["elevation_deg"])
        return visible[: self.check_limit(limit)]

    def passes(self, row: dict, point: str, min_elevation: float = 10.0,
               days: int = 2, limit: int = 10) -> list[dict]:
        """Upcoming passes of one satellite over a point, soonest first."""
        lat, lon = self.check_point(point)
        min_elevation = self.check_elevation(min_elevation)
        days = self.check_days(days)
        limit = self.check_limit(limit)
        orbit = prepare(row)
        start = datetime.now(timezone.utc).replace(microsecond=0)
        start_jd = julian_date(start)
        total = int(days * 24 * 3600)

        def stamp(offset: int) -> str:
            return (start + timedelta(seconds=offset)).strftime("%Y-%m-%dT%H:%M:%SZ")

        # A sweep step is 20 s of propagation, which is far more work than
        # formatting a timestamp: formatting inside the loop made the whole
        # sweep three times slower, so offsets are tracked and stamped once a
        # pass is closed.
        found: list[dict] = []
        opened: dict | None = None
        for offset in range(0, total + SWEEP_STEP_SECONDS, SWEEP_STEP_SECONDS):
            position = propagate_prepared(orbit, start_jd + offset / DAY_SECONDS)
            elevation = look_angles(position, lat, lon)["elevation_deg"]
            if elevation >= min_elevation:
                if opened is None:
                    opened = {"start": offset, "end": offset, "max_elevation_deg": elevation,
                              "max_at": offset, "range_km": 0, "azimuth_deg": 0}
                opened["end"] = offset
                if elevation > opened["max_elevation_deg"]:
                    opened["max_elevation_deg"] = elevation
                    opened["max_at"] = offset
                    angles = look_angles(position, lat, lon)
                    opened["range_km"] = angles["range_km"]
                    opened["azimuth_deg"] = angles["azimuth_deg"]
            elif opened is not None:
                found.append(_pass_record(opened, stamp))
                opened = None
            if len(found) >= limit:
                break
        if opened is not None and len(found) < limit:
            found.append(_pass_record(opened, stamp))
        return found

    def group_passes(self, point: str, min_elevation: float = 10.0, group: str = "stations",
                     days: int = 2, limit: int = 10) -> dict:
        """Upcoming passes for a whole group, soonest first.

        The entire group is swept before anything is truncated. CelesTrak
        returns the group in its own order, so stopping early would let the
        listing decide the answer rather than the times.
        """
        rows = self._elements({"GROUP": self.check_group(group)})
        swept = rows[: MAX_GROUP_SATELLITES]
        collected: list[dict] = []
        for row in swept:
            age = epoch_age_hours(row)
            for entry in self.passes(row, point, min_elevation, days, limit=days * 24):
                entry = dict(entry)
                entry["object_name"] = row.get("OBJECT_NAME")
                entry["norad_cat_id"] = row.get("NORAD_CAT_ID")
                entry["element_set_age_hours"] = age
                collected.append(entry)
        collected.sort(key=lambda entry: entry["start"])
        return {
            "group": self.check_group(group),
            "passes": collected[: self.check_limit(limit)],
            "passes_found": len(collected),
            "satellites_swept": len(swept),
            "satellites_in_group": len(rows),
        }

    @staticmethod
    def freshness() -> str:
        """CelesTrak is live, so freshness is the moment we read it."""
        return utc_now_iso()
