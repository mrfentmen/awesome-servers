"""Read-only client for 7Timer's astronomical forecast.

Endpoint (keyless, verified live on 2026-09-29):

  - /bin/api.pl?lon=-74.0060&lat=40.7128&product=astro&output=json
        HTTP 200, product 'astro', init '2026092900', 24 slots of 3 hours.
        First slot: timepoint 3, cloudcover 9, seeing 6, transparency 5,
        wind10m {direction 'NW', speed 2}, temp2m 15, prec_type 'none'.

Four things the payload makes plain and this reader keeps.

**The three indices all run the same way: bigger is better.** Cloud cover is 1
(fully covered) to 9 (no cloud at all), seeing is 1 (very bad) to 8 (very good)
and transparency is 1 (very bad) to 7 (excellent), so reading a low cloud cover
as "clear" would invert every answer. The words for each value are published
here so an answer can say what a 9 means.

**`init` is YYYYMMDDHH in UTC**, which is not a format `datetime` will parse,
and a `timepoint` is hours *after* that init rather than an hour of the day.

**The run is 24 slots of 3 hours, so 72 hours**, not the 48 the product's name
suggests.

And **there is no darkness and no moon in this product.** No slot says whether
the Sun is up, and none says where the Moon is. For faint targets the Moon
matters more than any of these indices, so nothing here invents a phase, and a
"good window" is a run of good *sky* conditions rather than a run of night.
"""

from __future__ import annotations

import datetime
import re

from a2a_kit import JsonApiClient, UpstreamError, utc_now_iso

BASE_URL = "https://www.7timer.info"
ASTRO_PATH = "/bin/api.pl"

DATASET = "7timer.info/bin/api.pl?product=astro"
PRODUCT = "7Timer astronomical forecast"

#: The astronomical product runs 24 slots of 3 hours, which is 72 hours.
SLOTS = 24
SLOT_HOURS = 3
HORIZON_HOURS = SLOTS * SLOT_HOURS

#: What the published index scales are, so an answer can say what a value means.
CLOUD_SCALE = {1: "fully covered", 2: "almost completely covered", 3: "mostly covered",
               4: "covered", 5: "roughly half covered", 6: "half or less covered",
               7: "mostly clear", 8: "nearly clear", 9: "no cloud at all"}
SEEING_SCALE = {1: "very bad", 2: "bad", 3: "poor", 4: "below average", 5: "average",
                6: "above average", 7: "good", 8: "very good"}
TRANSPARENCY_SCALE = {1: "very bad", 2: "bad", 3: "poor", 4: "below average", 5: "average",
                      6: "good", 7: "excellent"}

#: Places an editor is likely to ask about, with the coordinates 7Timer wants.
#: Editorial conveniences: an answer always says which point it used.
PLACES = {
    "new york": (40.7128, -74.0060, "New York, New York"),
    "los angeles": (34.0522, -118.2437, "Los Angeles, California"),
    "chicago": (41.8781, -87.6298, "Chicago, Illinois"),
    "houston": (29.7604, -95.3698, "Houston, Texas"),
    "phoenix": (33.4484, -112.0740, "Phoenix, Arizona"),
    "san francisco": (37.7749, -122.4194, "San Francisco, California"),
    "seattle": (47.6062, -122.3321, "Seattle, Washington"),
    "portland": (45.5152, -122.6784, "Portland, Oregon"),
    "denver": (39.7392, -104.9903, "Denver, Colorado"),
    "boston": (42.3601, -71.0589, "Boston, Massachusetts"),
    "miami": (25.7617, -80.1918, "Miami, Florida"),
    "austin": (30.2672, -97.7431, "Austin, Texas"),
    "toronto": (43.6532, -79.3832, "Toronto, Ontario"),
    "vancouver": (49.2827, -123.1207, "Vancouver, British Columbia"),
    "mexico city": (19.4326, -99.1332, "Mexico City, Mexico"),
    "london": (51.5074, -0.1278, "London, United Kingdom"),
    "edinburgh": (55.9533, -3.1883, "Edinburgh, United Kingdom"),
    "dublin": (53.3498, -6.2603, "Dublin, Ireland"),
    "paris": (48.8566, 2.3522, "Paris, France"),
    "madrid": (40.4168, -3.7038, "Madrid, Spain"),
    "berlin": (52.5200, 13.4050, "Berlin, Germany"),
    "amsterdam": (52.3676, 4.9041, "Amsterdam, Netherlands"),
    "rome": (41.9028, 12.4964, "Rome, Italy"),
    "stockholm": (59.3293, 18.0686, "Stockholm, Sweden"),
    "reykjavik": (64.1466, -21.9426, "Reykjavik, Iceland"),
    "tokyo": (35.6762, 139.6503, "Tokyo, Japan"),
    "sydney": (-33.8688, 151.2093, "Sydney, Australia"),
    "melbourne": (-37.8136, 144.9631, "Melbourne, Australia"),
    "auckland": (-36.8485, 174.7633, "Auckland, New Zealand"),
    "cape town": (-33.9249, 18.4241, "Cape Town, South Africa"),
    "nairobi": (-1.2921, 36.8219, "Nairobi, Kenya"),
    "cairo": (30.0444, 31.2357, "Cairo, Egypt"),
    "santiago": (-33.4489, -70.6693, "Santiago, Chile"),
    "sao paulo": (-23.5505, -46.6333, "Sao Paulo, Brazil"),
    "buenos aires": (-34.6037, -58.3816, "Buenos Aires, Argentina"),
    "mauna kea": (19.8207, -155.4681, "Mauna Kea, Hawaii"),
    "atacama": (-24.6272, -70.4042, "Atacama Desert, Chile"),
    "la palma": (28.7543, -17.8850, "La Palma, Canary Islands"),
    "sutherland": (-32.3783, 20.8106, "Sutherland, South Africa"),
}

_COORDS_RE = re.compile(
    r"(-?\d{1,2}(?:\.\d+)?)\s*(?:deg\s*)?([NS])?\s*[, ]\s*"
    r"(-?\d{1,3}(?:\.\d+)?)\s*(?:deg\s*)?([EW])?",
    re.IGNORECASE,
)

__all__ = [
    "ASTRO_PATH",
    "BASE_URL",
    "CLOUD_SCALE",
    "DATASET",
    "HORIZON_HOURS",
    "PLACES",
    "PRODUCT",
    "SEEING_SCALE",
    "SLOTS",
    "SLOT_HOURS",
    "StargazingClient",
    "TRANSPARENCY_SCALE",
    "UpstreamError",
    "coordinates_from_text",
    "describe_cloud",
    "describe_seeing",
    "describe_transparency",
    "parse_init",
    "place_from_text",
    "precipitation_word",
]


def place_from_text(text: str):
    """(latitude, longitude, label) for a place named in the question, or None.

    Longest name first, so "mexico city" is not read as "mexico".
    """
    lowered = str(text or "").lower()
    if not lowered.strip():
        return None
    for name in sorted(PLACES, key=len, reverse=True):
        if re.search(rf"\b{re.escape(name)}\b", lowered):
            return PLACES[name]
    return None


def coordinates_from_text(text: str):
    """(latitude, longitude) written out in the sentence, or None.

    Reads the N/S/E/W suffixes people actually type, because "51.5N, 0.1W" is a
    longitude a lot of readers would otherwise get the sign of wrong.
    """
    match = _COORDS_RE.search(str(text or ""))
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
    return round(latitude, 4), round(longitude, 4)


def parse_init(init):
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
    """What a cloud-cover index means. Bigger is better, which is the trap."""
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


def precipitation_word(prec_type) -> str:
    """7Timer's precipitation word, or the honest 'none forecast'."""
    text = str(prec_type or "").strip()
    if not text or text.lower() == "none":
        return "none forecast"
    return text


class StargazingClient(JsonApiClient):
    """7Timer's astronomical forecast, read into dated slots."""

    env_prefix = "STARGAZING"
    base_url = BASE_URL

    @staticmethod
    def check_coordinates(latitude, longitude) -> tuple[float, float]:
        try:
            lat, lon = float(latitude), float(longitude)
        except (TypeError, ValueError):
            raise ValueError("latitude and longitude must be numbers") from None
        if not -90.0 <= lat <= 90.0:
            raise ValueError("latitude must be between -90 and 90")
        if not -180.0 <= lon <= 180.0:
            raise ValueError("longitude must be between -180 and 180")
        return round(lat, 4), round(lon, 4)

    @staticmethod
    def freshness() -> str:
        """7Timer republishes on its own schedule, so freshness is when we read it."""
        return utc_now_iso()

    def forecast(self, latitude, longitude) -> dict:
        """The whole run of slots for a point, oldest first.

        The forecast is cached on the client's TTL: 7Timer republishes on its
        own schedule, so asking twice in a minute is one read.
        """
        lat, lon = self.check_coordinates(latitude, longitude)
        params = {"lon": f"{lon:.4f}", "lat": f"{lat:.4f}",
                  "product": "astro", "output": "json"}
        payload = self.get_json(ASTRO_PATH, params)
        if not isinstance(payload, dict):
            raise UpstreamError("7Timer returned an unexpected payload")
        if str(payload.get("error") or "").strip():
            raise UpstreamError(f"7Timer refused the request: {payload['error']}")
        series = payload.get("dataseries")
        if not isinstance(series, list) or not series:
            raise UpstreamError(f"7Timer has no astronomical forecast for {lat}, {lon}")

        started = parse_init(payload.get("init"))
        rows = []
        for entry in series[:SLOTS]:
            if not isinstance(entry, dict):
                continue
            try:
                offset = int(entry.get("timepoint"))
            except (TypeError, ValueError):
                continue
            moment = (started + datetime.timedelta(hours=offset)) if started else None
            wind = entry.get("wind10m") or {}
            rows.append({
                "timepoint": offset,
                "utc": moment.isoformat().replace("+00:00", "Z") if moment else None,
                "cloudcover": entry.get("cloudcover"),
                "cloud_word": describe_cloud(entry.get("cloudcover")),
                "seeing": entry.get("seeing"),
                "seeing_word": describe_seeing(entry.get("seeing")),
                "transparency": entry.get("transparency"),
                "transparency_word": describe_transparency(entry.get("transparency")),
                "lifted_index": entry.get("lifted_index"),
                "temperature_c": entry.get("temp2m"),
                "humidity": entry.get("rh2m"),
                "wind_direction": wind.get("direction"),
                "wind_speed": wind.get("speed"),
                "precipitation": precipitation_word(entry.get("prec_type")),
            })
        if not rows:
            raise UpstreamError(f"7Timer sent no usable slot for {lat}, {lon}")
        rows.sort(key=lambda row: row["timepoint"])
        return {
            "dataset": DATASET,
            "product": payload.get("product") or "astro",
            "latitude": lat,
            "longitude": lon,
            "init": payload.get("init"),
            "started_utc": started.isoformat() if started else None,
            "slot_hours": SLOT_HOURS,
            "count": len(rows),
            "horizon_hours": rows[-1]["timepoint"],
            "covers_daylight": False,
            "covers_moon": False,
            "slots": rows,
            "freshness": utc_now_iso(),
        }

    def upcoming(self, latitude, longitude, hours: int = 12) -> dict:
        """The run cut to the next `hours`, which is what "tonight" means."""
        try:
            window = int(hours)
        except (TypeError, ValueError):
            raise ValueError("hours must be a whole number") from None
        if not 3 <= window <= HORIZON_HOURS:
            raise ValueError(f"hours must be between 3 and {HORIZON_HOURS}")
        run = self.forecast(latitude, longitude)
        return {**run, "window_hours": window,
                "slots": [slot for slot in run["slots"] if slot["timepoint"] <= window],
                "count": len([slot for slot in run["slots"] if slot["timepoint"] <= window])}
