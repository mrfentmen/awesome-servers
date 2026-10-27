"""Read-only client for the MBTA v3 API (api-v3.mbta.com).

Endpoints (keyless, verified live 2026-09-28):
  - /predictions                          real-time arrivals at a stop or place
  - /schedules                           today's timetable for a stop
  - /stops, /stops/{id}                  the stop catalogue, and one stop's detail
  - /alerts                              service alerts, optionally by route
  - /routes                              the line catalogue (names, colours, directions)

Four things about this API shape the client:

1. It is JSON:API, so every record is `{id, type, attributes, relationships}` and a
   `?include=route` comes back as a sibling `included` array. Route names, line
   colours and the direction destinations all live there, never in the record
   itself, so `include_routes` indexes them by id and both paths read from that.
2. An unknown stop is not an error: `/predictions` and `/schedules` answer HTTP
   200 with an empty `data` array, so "nothing to report" and "no such stop" both
   have to be written out rather than caught.
3. Real errors are a 4xx with an `errors` array; an unauthenticated caller is also
   rate limited, which is why every read here is cached and the smoke test
   spaces its calls.
4. `arrival_time` is always an ISO 8601 timestamp with the agency's own UTC
   offset, so comparisons are plain `datetime` comparisons and nothing needs a
   clock of its own.
"""

from __future__ import annotations

import math
import os
import re
from datetime import datetime, timedelta, timezone

from a2a_kit import JsonApiClient, UpstreamError, utc_now_iso

BASE_URL = "https://api-v3.mbta.com"

PREDICTIONS_PATH = "/predictions"
SCHEDULES_PATH = "/schedules"
STOPS_PATH = "/stops"
STOP_PATH = "/stops/{stop}"
ALERTS_PATH = "/alerts"
ROUTES_PATH = "/routes"

DATASET = "api-v3.mbta.com"
PRODUCT = "MBTA v3 real-time predictions, schedules and service alerts"
SOURCE = "Massachusetts Bay Transportation Authority"

#: An unauthenticated caller is rate limited, so the line catalogue (which barely
#: changes) is cached for a day and the live feeds for a couple of minutes.
ROUTE_TTL = 86400.0
LIVE_TTL = 120.0
CATALOGUE_TTL = 900.0

MAX_ARRIVALS = 50
MAX_STOPS = 25
MAX_ALERTS = 25

#: The MBTA runs past midnight, so its service day is not the UTC one.
AGENCY_TIMEZONE = "America/New_York"
#: The agency's own page cap, and the only way to reach the rest of a service day.
SCHEDULE_PAGE_LIMIT = 500

#: MBTA's own alert wording, kept as reported rather than paraphrased.
ALERT_SEVERITY = {
    1: "severe",
    2: "warning",
    3: "info",
    7: "info",
    8: "info",
    9: "info",
    10: "info",
}

#: MBTA stop ids are alphanumeric with dashes: place-pktrm, 70068, CR-0123.
_STOP_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]{0,39}$")
_ROUTE_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]{0,19}$")
_POINT_RE = re.compile(r"^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$")

ROUTE_FIELDS = ("long_name", "short_name", "description", "color", "text_color",
                "direction_names", "direction_destinations", "type", "listed_route")
STOP_FIELDS = ("name", "municipality", "latitude", "longitude", "location_type",
               "platform_name", "description", "wheelchair_boarding", "at_street", "on_street")
ALERT_FIELDS = ("header", "short_header", "description", "severity", "cause", "effect",
                "service_effect", "lifecycle", "timeframe", "duration_certainty",
                "url", "created_at", "updated_at", "active_period")

__all__ = [
    "AGENCY_TIMEZONE",
    "ALERT_FIELDS",
    "ALERT_SEVERITY",
    "ALERTS_PATH",
    "BASE_URL",
    "CATALOGUE_TTL",
    "DATASET",
    "LIVE_TTL",
    "MAX_ALERTS",
    "MAX_ARRIVALS",
    "MAX_STOPS",
    "MbtaClient",
    "PREDICTIONS_PATH",
    "PRODUCT",
    "ROUTES_PATH",
    "ROUTE_FIELDS",
    "ROUTE_TTL",
    "SCHEDULES_PATH",
    "SCHEDULE_PAGE_LIMIT",
    "SOURCE",
    "STOP_FIELDS",
    "STOPS_PATH",
    "STOP_PATH",
    "UpstreamError",
    "haversine_km",
    "parse_arrival",
    "relative_minutes",
]


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in kilometres."""
    radius = 6371.0088
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    return 2 * radius * math.asin(math.sqrt(a))


def parse_arrival(value) -> datetime | None:
    """An MBTA timestamp to an aware datetime, or None when it is not one."""
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value))
    except ValueError:
        return None


def relative_minutes(when: datetime, now: datetime | None = None) -> int:
    """Whole minutes from now until `when`, rounded down and never negative."""
    now = now or datetime.now(timezone.utc)
    if when.tzinfo is None:
        when = when.replace(tzinfo=timezone.utc)
    return max(0, int((when - now).total_seconds() // 60))


class MbtaClient(JsonApiClient):
    env_prefix = "MBTA"
    base_url = BASE_URL

    def __init__(self, fetch=None, base_url=None, cache_ttl=None, timeout=None, headers=None) -> None:
        super().__init__(fetch=fetch, base_url=base_url, cache_ttl=cache_ttl, timeout=timeout, headers=headers)
        self.live_ttl = float(os.environ.get(f"{self.env_prefix}_LIVE_TTL", LIVE_TTL))
        self.catalogue_ttl = float(os.environ.get(f"{self.env_prefix}_CATALOGUE_TTL", CATALOGUE_TTL))
        self.route_ttl = float(os.environ.get(f"{self.env_prefix}_ROUTE_TTL", ROUTE_TTL))
        self.schedule_limit = int(os.environ.get(f"{self.env_prefix}_SCHEDULE_LIMIT", SCHEDULE_PAGE_LIMIT))

    # -- validation --------------------------------------------------------

    @staticmethod
    def check_stop(value) -> str:
        """An MBTA stop id: `place-pktrm`, `70068` or `CR-0123`."""
        stop = str(value).strip()
        if not _STOP_RE.match(stop):
            raise ValueError(
                "an MBTA stop id looks like place-pktrm (Kendall/GIT) or 70068 (a platform id), "
                "not a station name"
            )
        return stop

    @staticmethod
    def check_route(value) -> str:
        """An MBTA route id: `Red`, `66`, `1`."""
        route = str(value).strip()
        if not _ROUTE_RE.match(route):
            raise ValueError("an MBTA route id looks like Red, 66 or 1")
        return route

    @staticmethod
    def check_direction(value) -> int | None:
        if value is None or value == "":
            return None
        try:
            direction = int(value)
        except (TypeError, ValueError):
            raise ValueError("direction is 0 or 1, the way the route itself numbers them") from None
        if direction not in (0, 1):
            raise ValueError("direction is 0 or 1, the way the route itself numbers them")
        return direction

    @staticmethod
    def check_point(point) -> tuple[float, float]:
        match = _POINT_RE.match(str(point))
        if not match:
            raise ValueError("a point is 'lat,lon', for example 42.3519,-71.0601")
        lat, lon = float(match.group(1)), float(match.group(2))
        if not -90 <= lat <= 90 or not -180 <= lon <= 180:
            raise ValueError("latitude must be -90..90 and longitude -180..180")
        return round(lat, 5), round(lon, 5)

    @staticmethod
    def check_limit(value, maximum: int = MAX_ARRIVALS) -> int:
        try:
            limit = int(value)
        except (TypeError, ValueError):
            raise ValueError("limit must be a whole number") from None
        if not 1 <= limit <= maximum:
            raise ValueError(f"limit must be between 1 and {maximum}")
        return limit

    @staticmethod
    def check_date(value) -> str:
        """One service day, as YYYY-MM-DD."""
        day = str(value).strip()
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", day):
            raise ValueError("a date is YYYY-MM-DD, for example 2026-09-30")
        try:
            datetime.strptime(day, "%Y-%m-%d")
        except ValueError:
            raise ValueError("that date does not exist") from None
        return day

    @staticmethod
    def agency_day(offset_days: int = 0) -> str:
        """A service day in the agency's own time, not UTC.

        The MBTA runs past midnight, so "today" for a rider is the agency's date. If
        the platform has no timezone database the UTC date is used instead, which is
        only ever wrong within a few hours of midnight.
        """
        try:
            from zoneinfo import ZoneInfo

            now = datetime.now(ZoneInfo(AGENCY_TIMEZONE))
        except Exception:  # no tzdata on this platform
            now = datetime.now(timezone.utc)
        return (now.date() + timedelta(days=offset_days)).isoformat()

    def agency_today(self) -> str:
        return self.agency_day(0)

    def agency_tomorrow(self) -> str:
        return self.agency_day(1)

    # -- transport ---------------------------------------------------------

    def _read(self, path: str, params: dict, ttl: float) -> dict:
        """One JSON:API GET, with MBTA's 4xx error array read into one message."""
        payload = self.get_json(path, params, ttl=ttl)
        if not isinstance(payload, dict):
            raise UpstreamError("the MBTA returned an unexpected payload")
        problems = payload.get("errors")
        if isinstance(problems, list) and problems:
            first = problems[0] if isinstance(problems[0], dict) else {}
            detail = first.get("detail") or first.get("title") or "unknown error"
            raise UpstreamError(f"the MBTA refused that request: {detail}")
        return payload

    @staticmethod
    def include_index(payload: dict, kind: str) -> dict:
        """`?include=route` comes back as a sibling array; index it by id."""
        index = {}
        for item in payload.get("included") or []:
            if isinstance(item, dict) and item.get("type") == kind and item.get("id"):
                index[item["id"]] = item.get("attributes") or {}
        return index

    @staticmethod
    def records(payload: dict) -> list:
        """`data` as a list. A path-parameter endpoint like /stops/{id} returns a
        single object rather than an array, so both shapes are read the same way."""
        data = payload.get("data")
        if data is None:
            raise UpstreamError("the MBTA returned an unexpected payload")
        if isinstance(data, dict):
            return [data]
        if not isinstance(data, list):
            raise UpstreamError("the MBTA returned an unexpected payload")
        return data

    @staticmethod
    def _relation_id(record: dict, name: str) -> str | None:
        data = (record.get("relationships") or {}).get(name) or {}
        return (data.get("data") or {}).get("id")

    def _arrival(self, record: dict, routes: dict) -> tuple[datetime, dict] | None:
        """One prediction or schedule record as (arrival time, flat row).

        The datetime is kept beside the row rather than inside it, because the row
        goes straight into an artifact and a datetime is not JSON.
        """
        attributes = record.get("attributes") or {}
        when = parse_arrival(attributes.get("arrival_time"))
        if when is None:
            return None
        route_id = self._relation_id(record, "route")
        route = routes.get(route_id) or {}
        direction = attributes.get("direction_id")
        if direction is not None:
            try:
                direction = int(direction)
            except (TypeError, ValueError):
                direction = None
        destinations = route.get("direction_destinations") or []
        direction_names = route.get("direction_names") or []
        return when, {
            "at": attributes.get("arrival_time"),
            "route": route_id,
            "route_name": route.get("long_name") or route.get("description") or route_id or "route not reported",
            "color": route.get("color"),
            "direction_id": direction,
            "direction": (attributes.get("trip_headsign")
                          or (destinations[direction] if direction is not None and direction < len(destinations) else None)
                          or (direction_names[direction] if direction is not None and direction < len(direction_names) else None)
                          or "direction not reported"),
            "uncertainty_minutes": attributes.get("arrival_uncertainty"),
            "minutes": relative_minutes(when),
        }

    # -- reads -------------------------------------------------------------

    def predictions(self, stop: str, route: str | None = None, direction_id: int | None = None,
                    limit: int = 10) -> list[dict]:
        """Live arrivals at a stop, soonest first."""
        stop = self.check_stop(stop)
        limit = self.check_limit(limit)
        params: dict = {"sort": "arrival_time", "page[limit]": limit, "include": "route"}
        params["filter[stop]"] = stop
        if route:
            params["filter[route]"] = self.check_route(route)
        if direction_id is not None:
            params["filter[direction_id]"] = self.check_direction(direction_id)
        payload = self._read(PREDICTIONS_PATH, params, ttl=min(self.live_ttl, self.cache_ttl))
        routes = self.include_index(payload, "route")
        arrivals = []
        for record in self.records(payload):
            parsed = self._arrival(record, routes)
            # The feed only holds departures that have not gone yet, but a vehicle
            # mid-trip can still be listed a few seconds late.
            if parsed and parsed[0] > datetime.now(timezone.utc):
                arrivals.append(parsed)
        arrivals.sort(key=lambda parsed: parsed[0])
        return [row for _, row in arrivals[:limit]]

    def schedules(self, stop: str, limit: int = 10, date: str | None = None) -> list[dict]:
        """The timetable at a stop for one service day, forward from now.

        `filter[min_time]` is accepted by the schedules endpoint and then ignored, and
        an undated request returns the service day in progress from its first row. So
        the only way to the rest of today is to ask for the date outright and take the
        whole day: `page[limit]` is the agency's own cap of 500, and the read is
        cached, so this is one request per cache window rather than one per question.
        """
        stop = self.check_stop(stop)
        limit = self.check_limit(limit)
        day = self.check_date(date) if date else self.agency_today()
        params = {
            "filter[stop]": stop,
            "filter[date]": day,
            "sort": "arrival_time",
            "page[limit]": self.schedule_limit,
            "include": "route",
        }
        payload = self._read(SCHEDULES_PATH, params, ttl=min(self.catalogue_ttl, self.cache_ttl))
        routes = self.include_index(payload, "route")
        rows = self.records(payload)
        # A future service day is returned whole; today is cut at the current moment.
        cutoff = datetime.now(timezone.utc) if day == self.agency_today() else datetime.min.replace(tzinfo=timezone.utc)
        upcoming = []
        for record in rows:
            parsed = self._arrival(record, routes)
            if parsed and parsed[0] > cutoff:
                upcoming.append(parsed)
        upcoming.sort(key=lambda parsed: parsed[0])
        return [row for _, row in upcoming[:limit]]

    def stop_info(self, stop: str) -> dict | None:
        """One stop's name, municipality and position, or None when there is no such stop."""
        stop = self.check_stop(stop)
        payload = self._read(STOP_PATH.format(stop=stop), {}, ttl=self.catalogue_ttl)
        rows = self.records(payload)
        if not rows:
            return None
        attributes = rows[0].get("attributes") or {}
        return {"stop": stop, **self.pick(attributes, STOP_FIELDS)}

    def nearby_stops(self, point: str, limit: int = 10, route: str | None = None) -> list[dict]:
        """Stops closest to a point. MBTA sorts by distance itself, then the list is capped."""
        lat, lon = self.check_point(point)
        limit = self.check_limit(limit, MAX_STOPS)
        params: dict = {
            "filter[latitude]": lat,
            "filter[longitude]": lon,
            "sort": "distance",
            "page[limit]": limit,
        }
        if route:
            params["filter[route]"] = self.check_route(route)
        payload = self._read(STOPS_PATH, params, ttl=min(self.catalogue_ttl, self.cache_ttl))
        rows = self.records(payload)
        stops = []
        for record in rows:
            attributes = record.get("attributes") or {}
            stop_lat, stop_lon = attributes.get("latitude"), attributes.get("longitude")
            stop = {"stop": record.get("id"), **self.pick(attributes, STOP_FIELDS)}
            if _to_float(stop_lat) is not None and _to_float(stop_lon) is not None:
                stop["distance_km"] = round(haversine_km(lat, lon, float(stop_lat), float(stop_lon)), 3)
            stops.append(stop)
        stops.sort(key=lambda stop: stop.get("distance_km", float("inf")))
        return stops[:limit]

    def alerts(self, route: str | None = None, stop: str | None = None, limit: int = 10) -> list[dict]:
        """Service alerts, optionally narrowed to one route or one stop."""
        limit = self.check_limit(limit, MAX_ALERTS)
        params: dict = {"page[limit]": limit, "sort": "-created_at"}
        if route:
            params["filter[route]"] = self.check_route(route)
        if stop:
            params["filter[stop]"] = self.check_stop(stop)
        payload = self._read(ALERTS_PATH, params, ttl=min(self.catalogue_ttl, self.cache_ttl))
        rows = self.records(payload)
        alerts = []
        for record in rows:
            attributes = record.get("attributes") or {}
            severity = attributes.get("severity")
            try:
                severity = int(severity)
            except (TypeError, ValueError):
                severity = None
            alerts.append({
                "id": record.get("id"),
                **self.pick(attributes, ALERT_FIELDS),
                "severity": severity,
                "severity_label": ALERT_SEVERITY.get(severity, "not reported"),
                "routes": sorted({
                    entity.get("route")
                    for entity in (attributes.get("informed_entity") or [])
                    if isinstance(entity, dict) and entity.get("route")
                }),
                "stops": sorted({
                    entity.get("stop")
                    for entity in (attributes.get("informed_entity") or [])
                    if isinstance(entity, dict) and entity.get("stop")
                }),
            })
        return alerts[:limit]

    def route_list(self) -> dict:
        """Every listed line, keyed by id. Cached for a day, so the search is free."""
        payload = self._read(ROUTES_PATH, {"filter[listed_route]": "true", "page[limit]": 250},
                             ttl=min(self.route_ttl, self.cache_ttl))
        rows = self.records(payload)
        return {record["id"]: self.pick(record.get("attributes") or {}, ROUTE_FIELDS)
                for record in rows if record.get("id")}

    def find_route(self, wanted: str) -> str | None:
        """A line id from an id, a long name, a short name or a description.

        "red", "Red Line" and "Red" all resolve to `Red`; the long name wins over
        the description so "Red Line" is not confused with another red service.
        """
        needle = str(wanted or "").strip().lower()
        if not needle:
            return None
        if _ROUTE_RE.match(needle):
            exact = self.route_list().get(needle)
            if exact:
                return needle
        for route_id, attributes in self.route_list().items():
            for field in ("long_name", "short_name", "description"):
                value = attributes.get(field)
                if value and str(value).strip().lower() == needle:
                    return route_id
        for route_id, attributes in self.route_list().items():
            for field in ("long_name", "short_name", "description"):
                value = attributes.get(field)
                if value and needle in str(value).strip().lower():
                    return route_id
        return None

    @staticmethod
    def freshness() -> str:
        """Predictions are live and alerts change without warning: both are read now."""
        return utc_now_iso()


def _to_float(value) -> float | None:
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None
