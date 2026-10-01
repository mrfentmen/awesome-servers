"""Near-Earth objects and their close approaches, from NASA's NEO feed.

Verified live on 2026-09-28:

  .../neo/rest/v1/feed?start_date=2026-09-26&end_date=2026-09-28&api_key=DEMO_KEY
      -> HTTP 200, element_count 17, near_earth_objects keyed by date
      -> 523934 (1998 FF14): absolute_magnitude_h 20.61,
         is_potentially_hazardous_asteroid true, is_sentry_object false,
         estimated_diameter {feet, kilometers},
         close_approach_data[0]: close_approach_date_full '2026-Sep-28 13:19',
           miss_distance {astronomical 0.1029 AU, kilometers 15393500.9,
           lunar 40.0278, miles 9565077.9}, relative_velocity {km/h 84522.75,
           km/s 23.4785, mph 52519.15}
  .../neo/rest/v1/feed?start_date=2026-09-20&end_date=2026-09-28&api_key=DEMO_KEY
      -> HTTP 400, error_message 'Date Format Exception - Expected format (yyyy-mm-dd)
         - The Feed date limit is only 7 Days'
  .../neo/rest/v1/neo/2523934?api_key=DEMO_KEY&pretty=1
      -> HTTP 200, and the object is at the TOP LEVEL, not nested under 'object' as the
         documentation suggests. It carries `designation`, `orbital_data` and
         `close_approach_data` with 16 approaches spanning 1925 to 2179.

Three things the payloads make plain and this reader keeps. **The feed window is at
most 7 days** and a longer one is a hard HTTP 400, so a "this week" question has to be
asked as a week and a "this month" question has to say it is not one request. **The
date keys come back in no particular order**, so they are sorted here rather than
printed as the feed happened to order them. And **DEMO_KEY is shared and rate-limited
to 30 requests an hour per address**, so a 429 is an expected answer and is reported as
one with the reason, never retried blindly; put a free key from api.nasa.gov in
NASA_API_KEY to raise the limit.
"""

from __future__ import annotations

import datetime
import json
import os
import re
import time
from urllib import parse, request
from urllib.error import HTTPError

FEED_URL = "https://api.nasa.gov/neo/rest/v1/feed"
DETAIL_URL = "https://api.nasa.gov/neo/rest/v1/neo"

DATASET = "NASA Near-Earth Object feed (api.nasa.gov)"

DEFAULT_USER_AGENT = "awesome-acps-asteroids/1.0 (+https://github.com/mrfentmen/awesome-acps)"

#: The feed refuses a longer window than this with HTTP 400.
MAX_DAYS = 7

#: What an unkeyed caller gets, and NASA rate-limits it to 30 requests an hour per
#: address. Overridable with a free key from https://api.nasa.gov/.
DEMO_KEY = "DEMO_KEY"

#: Below this the object passes closer than the Moon on average.
LUNAR_DISTANCE_KM = 384400.0

#: One astronomical unit, km. NASA publishes miss_distance in all of these.
AU_KM = 149597870.7


class AsteroidError(RuntimeError):
    """NASA's NEO feed could not be read."""


class AsteroidNotFound(AsteroidError):
    """The feed answered, and holds nothing for that - a real 'nothing here'."""


class AsteroidRateLimited(AsteroidError):
    """NASA's shared demo key ran out of requests. A 429, not a failure of this agent."""


def api_key() -> str:
    """The caller's NASA key, or the shared demo key. No key is ever hardcoded here."""
    return (os.environ.get("NASA_API_KEY") or DEMO_KEY).strip()


def window_dates(start: str | None = None, end: str | None = None,
                 days: int = MAX_DAYS) -> tuple[str, str]:
    """A start and an end date, never more than 7 days apart, as yyyy-mm-dd.

    A longer request is a hard HTTP 400 from NASA, so the span is cut here and the
    caller is told what it got rather than being handed an error page.
    """
    today = datetime.date.today()
    first = _as_date(start) or today
    last = _as_date(end) or (first + datetime.timedelta(days=max(1, min(int(days), MAX_DAYS)) - 1))
    if last < first:
        first, last = last, first
    if (last - first).days + 1 > MAX_DAYS:
        last = first + datetime.timedelta(days=MAX_DAYS - 1)
    return first.isoformat(), last.isoformat()


def _as_date(value) -> datetime.date | None:
    if isinstance(value, datetime.date):
        return value
    match = re.fullmatch(r"(\d{4})-(\d{2})-(\d{2})", str(value or ""))
    if not match:
        return None
    try:
        return datetime.date(int(match.group(1)), int(match.group(2)), int(match.group(3)))
    except ValueError:
        return None


def number(value, default=None):
    """NASA publishes numbers as JSON numbers *and* as strings; take either."""
    if value is None or value == "":
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def designation_in(text: str) -> str | None:
    """An asteroid name or provisional designation, e.g. '2026 AB' or '523934'."""
    working = str(text or "")
    match = re.search(r"\b(\d{4}\s?[A-Z]{1,2}\d{0,2})\b", working)
    if match:
        return re.sub(r"\s+", " ", match.group(1).upper())
    match = re.search(r"\((\d{4}\s[A-Z]{1,2}\d{0,2})\)", working.upper())
    if match:
        return re.sub(r"\s+", " ", match.group(1).upper())
    match = re.search(r"\b(\d{4,7})\b", working)
    if match:
        return match.group(1)
    return None


def object_matches(record: dict, wanted: str) -> bool:
    """Whether a feed record is the object the question named."""
    needle = re.sub(r"\s+", " ", str(wanted or "")).strip().upper()
    if not needle:
        return False
    for field in ("name", "designation"):
        value = str(record.get(field) or "").strip().upper()
        if not value:
            continue
        if value == needle or needle in value:
            return True
        #: '523934' should find '523934 (1998 FF14)' and '2026 AB' should find
        #: '2026 AB1'.
        if needle in value.split():
            return True
    return False


class AsteroidData:
    """NASA's NEO feed, read into plain numbers."""

    def __init__(self, fetch=None, cache_ttl: float = 3600.0, timeout: float = 40.0,
                 user_agent: str | None = None) -> None:
        self.cache_ttl = float(os.environ.get("ASTEROIDS_CACHE_TTL", cache_ttl))
        self.timeout = float(os.environ.get("ASTEROIDS_HTTP_TIMEOUT", timeout))
        self.user_agent = (user_agent or os.environ.get("ASTEROIDS_USER_AGENT")
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
            detail = ""
            try:
                body = json.loads(exc.read().decode("utf-8"))
                if isinstance(body, dict):
                    detail = str(body.get("error_message") or body.get("error") or "")
            except Exception:
                detail = ""
            suffix = f": {detail}" if detail else ""
            if exc.code == 429:
                #: The shared demo key is the usual cause and it is not this agent's
                #: fault, so it is said plainly and not retried.
                raise AsteroidRateLimited(
                    "NASA's shared DEMO_KEY is rate-limited to 30 requests an hour per "
                    f"address and this call was refused (HTTP 429){suffix}. Put a free key "
                    "from https://api.nasa.gov/ in NASA_API_KEY and ask again") from exc
            if exc.code == 400 and "7 Days" in detail:
                raise AsteroidError(
                    "NASA's feed takes at most 7 days at a time, so the window was cut to "
                    f"7 days{suffix}") from exc
            if exc.code == 404:
                raise AsteroidNotFound(f"NASA's feed has no such object{suffix}") from exc
            raise AsteroidError(f"request failed: HTTP {exc.code}{suffix}") from exc
        except Exception as exc:  # urllib raises many other types too
            raise AsteroidError(f"request failed: {exc}") from exc

    def _load(self, url: str, params: dict, ttl: float | None = None) -> dict:
        query = dict(params)
        query["api_key"] = api_key()
        key = f"{url}?{parse.urlencode(query, doseq=True)}"
        now = time.time()
        hit = self._cache.get(key)
        if hit and hit[0] > now:
            return hit[1]
        payload = self._fetch(url, query)
        if isinstance(payload, (str, bytes)):
            try:
                payload = json.loads(payload)
            except ValueError as exc:
                raise AsteroidError(
                    f"NASA's NEO feed returned something that is not JSON: {exc}") from exc
        if not isinstance(payload, dict):
            raise AsteroidError("NASA's NEO feed returned an unexpected payload")
        self._cache[key] = (now + (self.cache_ttl if ttl is None else ttl), payload)
        return payload

    # -- reads -------------------------------------------------------------

    def feed(self, start: str | None = None, end: str | None = None) -> dict:
        """Every close approach in a window, grouped by day in date order."""
        first, last = window_dates(start, end)
        payload = self._load(FEED_URL, {"start_date": first, "end_date": last})
        by_date = payload.get("near_earth_objects")
        if not isinstance(by_date, dict):
            raise AsteroidError("NASA's NEO feed returned no near_earth_objects block")
        if not by_date:
            raise AsteroidNotFound(
                f"NASA's feed lists no object with a close approach between {first} "
                f"and {last} - an empty window is a real answer, not a failure")

        days, records = [], []
        for date_key in sorted(by_date):
            entries = by_date[date_key]
            if not isinstance(entries, list):
                continue
            shaped = [self._record(entry) for entry in entries if isinstance(entry, dict)]
            shaped = [row for row in shaped if row]
            if not shaped:
                continue
            shaped.sort(key=lambda row: row["closest"]["miss_km"]
                        if row["closest"]["miss_km"] is not None else float("inf"))
            days.append({"date": date_key, "count": len(shaped),
                         "closest_km": shaped[0]["closest"]["miss_km"]})
            records.extend(shaped)
        if not records:
            raise AsteroidNotFound(
                f"NASA's feed sent no usable object for {first} to {last}")
        records.sort(key=lambda row: (row["approach_date"],
                                      row["closest"]["miss_km"]
                                      if row["closest"]["miss_km"] is not None else float("inf")))
        return {"start_date": first, "end_date": last, "days": days, "records": records,
                "count": len(records),
                "element_count": payload.get("element_count"),
                "hazardous": sum(1 for row in records if row["hazardous"]),
                "sentry": sum(1 for row in records if row["sentry"]),
                "source": DATASET}

    def lookup(self, wanted: str, start: str | None = None,
               end: str | None = None) -> dict:
        """One object by name or designation, searched inside a close-approach window.

        The feed has no name search, so this looks through the window NASA actually
        publishes and says so when the object is not in it - an object with no close
        approach in the window is simply not listed by this endpoint.
        """
        needle = designation_in(wanted) or str(wanted or "").strip()
        if not needle:
            raise ValueError("tell me which asteroid, for example 2026 AB or 523934")
        overview = self.feed(start, end)
        for row in overview["records"]:
            if object_matches(row, needle):
                return row
        raise AsteroidNotFound(
            f"NASA's feed does not list {needle!r} with a close approach between "
            f"{overview['start_date']} and {overview['end_date']}. This endpoint only "
            f"publishes objects that come close in the window, so widen the window or "
            f"check the designation")

    def detail(self, object_id: str) -> dict:
        """One object's full record, including every close approach NASA holds."""
        ident = str(object_id or "").strip()
        if not ident:
            raise ValueError("tell me which asteroid's NASA id, for example 2523934")
        payload = self._load(f"{DETAIL_URL}/{parse.quote(ident)}", {})
        #: The documentation puts the object under `object`; the live API returns it at
        #: the top level. Both are accepted so neither shape breaks the reader.
        record = payload.get("object") if isinstance(payload.get("object"), dict) else payload
        if not isinstance(record, dict) or not record.get("close_approach_data"):
            raise AsteroidNotFound(f"NASA's feed has no record for id {ident!r}")
        return self._record(record)

    # -- shaping -----------------------------------------------------------

    @classmethod
    def _record(cls, entry: dict) -> dict | None:
        """One object and its closest approach, as plain numbers."""
        name = entry.get("name")
        if not name:
            return None
        approaches = []
        for approach in entry.get("close_approach_data") or []:
            if not isinstance(approach, dict):
                continue
            miss = approach.get("miss_distance") or {}
            velocity = approach.get("relative_velocity") or {}
            kilometres = number(miss.get("kilometers"))
            approaches.append({
                "date": approach.get("close_approach_date"),
                "date_full": approach.get("close_approach_date_full"),
                "orbiting_body": approach.get("orbiting_body"),
                "miss_km": kilometres,
                "miss_au": number(miss.get("astronomical")),
                "miss_lunar": number(miss.get("lunar")),
                "miss_miles": number(miss.get("miles")),
                "velocity_km_s": number(velocity.get("kilometers_per_second")),
                "velocity_km_h": number(velocity.get("kilometers_per_hour")),
            })
        #: The feed carries several approaches per object; the closest one in the
        #: window is the one a reader means by 'how close did it come'.
        closest = min((row for row in approaches if row["miss_km"] is not None),
                      key=lambda row: row["miss_km"], default=None)
        if closest is None:
            return None
        approaches.sort(key=lambda row: str(row["date"] or ""))
        #: `estimated_diameter` nests a min and a max per unit, e.g.
        #: kilometers {estimated_diameter_min 0.2007, estimated_diameter_max 0.4488}. NASA
        #: publishes a range because the brightness implies a size, never a single figure.
        diameter = entry.get("estimated_diameter") or {}
        kilometres = diameter.get("kilometers")
        low_km = high_km = None
        if isinstance(kilometres, dict):
            low_km = number(kilometres.get("estimated_diameter_min"))
            high_km = number(kilometres.get("estimated_diameter_max"))
        else:
            low_km = high_km = number(kilometres)
        return {
            "id": entry.get("id"),
            "name": str(name).strip(),
            "designation": entry.get("designation"),
            "absolute_magnitude_h": number(entry.get("absolute_magnitude_h")),
            "diameter_km_min": low_km,
            "diameter_km_max": high_km,
            "diameter_km": None if low_km is None or high_km is None else (low_km + high_km) / 2.0,
            "diameter_feet": number((diameter.get("feet") or {}).get("estimated_diameter_min")
                                    if isinstance(diameter.get("feet"), dict) else None),
            "hazardous": bool(entry.get("is_potentially_hazardous_asteroid")),
            "sentry": bool(entry.get("is_sentry_object")),
            "reference_id": entry.get("neo_reference_id"),
            "jpl_url": entry.get("nasa_jpl_url"),
            "approaches": approaches,
            "approach_count": len(approaches),
            "closest": closest,
            "approach_date": closest.get("date"),
            "earliest_approach": approaches[0]["date"] if approaches else None,
        }
