"""How crowded the Red Line will be on a Boston commute, from MBTA's keyless v3 API.

Verified live on 2026-09-28, no API key:

  /predictions?filter[stop]=place-pktrm&filter[route]=Red
      -> arrival_time, departure_time, direction_id, arrival_uncertainty, status
  /alerts?filter[stop]=place-pktrm
      -> cause MAINTENANCE, active_period, description, severity
  /stops?filter[route]=Red   -> the 22 Red Line stations, place-* ids
  /schedules?filter[route]=Red&filter[stop]=place-pktrm
      -> the published timetable for that stop: 8500+ rows for a week

Three things the payloads make plain and this reader keeps. `direction_id` is 0 or
1, never a destination name, so the destination has to be read off the stop's
position on the route instead of invented. `status` is 0 on time and 1 when the
vehicle is predicted to be more than the uncertainty behind schedule, so a status
of 1 is the field that says "this train is late". And the timetable is a *week* of
rows, which is why the "how bad is the peak" answer groups by hour of day and takes
the median: one week of a commuter rail headway is not one number, and an average
would blend an empty 2am train into a packed 8am one.

MBTA rate-limits a keyless caller hard - paging the whole stop list gets HTTP 429
almost immediately, as this reader did on 2026-09-28 - so the station table below is
a fixed list of the Red Line's 22 stations, read once from
`/stops?filter[route]=Red`, and the timetable window is capped. Predictions and
alerts are one cheap call each.
"""

from __future__ import annotations

import json
import os
import re
import time
from urllib import parse, request
from urllib.error import HTTPError

API = "https://api-v3.mbta.com/"

DATASET = "MBTA API v3 (api-v3.mbta.com)"

DEFAULT_USER_AGENT = "awesome-acps-boston/1.0 (+https://github.com/mrfentmen/awesome-acps)"

#: MBTA's own route id for the Red Line. The predictions feed is keyed by it, and
#: the free "which line" skill only accepts the id or the colour.
RED_ROUTE = "Red"

#: The Red Line's 22 stations, `place-*` ids, read live from
#: `/stops?filter[route]=Red` on 2026-09-28. Kept as a list because a keyless
#: caller cannot page the whole stop list without hitting HTTP 429. Index 0 is
#: Alewife (north end) and the last is Braintree (south end), which is the order
#: the predictions feed's `direction_id` is measured against: 0 heads toward
#: Ashmont/Braintree, 1 heads toward Alewife.
RED_LINE_STOPS: tuple[tuple[str, str], ...] = (
    ("place-alfcl", "Alewife"),
    ("place-davis", "Davis"),
    ("place-portr", "Porter"),
    ("place-harsq", "Harvard"),
    ("place-cntsq", "Central"),
    ("place-knncl", "Kendall/MIT"),
    ("place-chmnl", "Charles/MGH"),
    ("place-pktrm", "Park Street"),
    ("place-dwnxg", "Downtown Crossing"),
    ("place-sstat", "South Station"),
    ("place-brdwy", "Broadway"),
    ("place-andrw", "Andrew"),
    ("place-jfk", "JFK/UMass"),
    ("place-shmnl", "Savin Hill"),
    ("place-fldcr", "Fields Corner"),
    ("place-smmnl", "Shawmut"),
    ("place-asmnl", "Ashmont"),
    ("place-nqncy", "North Quincy"),
    ("place-wlsta", "Wollaston"),
    ("place-qnctr", "Quincy Center"),
    ("place-qamnl", "Quincy Adams"),
    ("place-brntn", "Braintree"),
)

#: MBTA publishes a header naming which product wants more keyless calls. It is
#: polite to echo it, and this reader also backs off when the API says 429.
RATE_HEADER = "x-ratelimit-limit"

#: Trips to ask for. The published timetable for one stop in one week is 8500+
#: rows, so a 1000-row cap keeps the answer inside one page and one call.
DEFAULT_WINDOW_TRIPS = 1000

#: Never read a timetable window wider than this many rows: past it the hourly
#: medians are the same numbers with more latency.
MAX_WINDOW_TRIPS = 2000


class BostonError(RuntimeError):
    """MBTA's API could not be read."""


class BostonNotFound(BostonError):
    """MBTA answered 404, or named no stop - a real 'nothing here', not a failure."""


def median(values: list[float]) -> float | None:
    """The middle value, without importing statistics for one line."""
    if not values:
        return None
    ordered = sorted(values)
    middle = len(ordered) // 2
    if len(ordered) % 2:
        return ordered[middle]
    return (ordered[middle - 1] + ordered[middle]) / 2


def stop_from_text(text: str) -> str | None:
    """A `place-*` stop id written out in the question, or None."""
    match = re.search(r"\bplace-[A-Za-z0-9]{3,12}\b", str(text or ""))
    return match.group(0) if match else None


def station_from_text(text: str) -> tuple[str, str] | None:
    """A Red Line station as (place id, name), from its name or a raw `place-*` id.

    Names are matched longest first, so "Quincy Center" is not read as "Quincy
    Adams" and "Downtown Crossing" is not read as "Downtown". An unknown name
    returns None, and the agent then asks which station rather than guessing one.
    """
    lowered = " ".join(str(text or "").lower().split())
    if not lowered:
        return None
    for stop_id, name in sorted(RED_LINE_STOPS, key=lambda pair: -len(pair[1])):
        if name.lower() in lowered:
            return stop_id, name
    raw = stop_from_text(lowered)
    if raw:
        return raw, _station_name(raw)
    return None


def destination_for(stop_id: str, direction_id: int) -> str:
    """Where a train at `stop_id` with `direction_id` is going.

    MBTA publishes `direction_id` as 0 or 1 and nothing else on the prediction, so
    the destination is read off where the stop sits on the line: 0 heads toward
    the south end (Ashmont or Braintree) and 1 toward the north end (Alewife).
    """
    ids = [pair[0] for pair in RED_LINE_STOPS]
    try:
        index = ids.index(stop_id)
    except ValueError:
        return "not reported"
    names = [pair[1] for pair in RED_LINE_STOPS]
    if direction_id == 0:
        # Alewife itself is the last stop southbound trains serve.
        if index <= names.index("Ashmont"):
            return "Ashmont"
        return "Braintree"
    return "Alewife" if index < len(names) - 1 else "not reported"


def _station_name(stop_id: str) -> str:
    """The line's own name for a `place-*` id."""
    for pair_id, name in RED_LINE_STOPS:
        if pair_id == stop_id:
            return name
    return stop_id


class BostonData:
    """Predictions, alerts and the published timetable for the Red Line."""

    def __init__(self, fetch=None, cache_ttl: float = 20.0, timeout: float = 40.0,
                 user_agent: str | None = None) -> None:
        self.cache_ttl = float(os.environ.get("BOSTON_CACHE_TTL", cache_ttl))
        self.timeout = float(os.environ.get("BOSTON_HTTP_TIMEOUT", timeout))
        self.user_agent = (user_agent or os.environ.get("BOSTON_USER_AGENT")
                           or DEFAULT_USER_AGENT)
        self._fetch = fetch or self._http_json
        self._cache: dict[str, tuple[float, object]] = {}

    # -- transport ---------------------------------------------------------

    def _http_json(self, url: str, params: dict | None = None) -> object:
        query = f"{url}?{parse.urlencode(params, doseq=True)}" if params else url
        req = request.Request(query, headers={"User-Agent": self.user_agent,
                                              "Accept": "application/vnd.mbta+json"})
        try:
            with request.urlopen(req, timeout=self.timeout) as resp:
                body = resp.read().decode("utf-8", "replace")
        except HTTPError as exc:
            # 429 is a rate limit, not a bad request, and it says so in the body.
            if exc.code == 429:
                raise BostonError(
                    "MBTA is rate-limiting this client (HTTP 429); the keyless feed allows only a "
                    "few calls a minute, so wait a moment and ask again") from exc
            if exc.code == 404:
                raise BostonNotFound(f"MBTA has no record for that (HTTP 404)") from exc
            raise BostonError(f"MBTA answered HTTP {exc.code}") from exc
        except Exception as exc:  # urllib raises many other types too
            raise BostonError(f"request failed: {exc}") from exc
        if not body.strip():
            return {}
        try:
            return json.loads(body)
        except ValueError as exc:
            raise BostonError(f"MBTA returned something that is not JSON: {exc}") from exc

    def _get(self, path: str, params: dict, ttl: float | None = None) -> dict:
        """One cached GET, keyed on the full query so two calls never share a row."""
        query = parse.urlencode(params, doseq=True)
        cache_key = f"{path}?{query}"
        now = time.time()
        hit = self._cache.get(cache_key)
        if hit and hit[0] > now:
            return hit[1]
        payload = self._fetch(f"{API}{path}", params)
        if isinstance(payload, (str, bytes)):
            try:
                payload = json.loads(payload)
            except ValueError as exc:
                raise BostonError(f"MBTA returned something that is not JSON: {exc}") from exc
        if not isinstance(payload, dict):
            raise BostonError("MBTA returned an unexpected payload")
        self._cache[cache_key] = (now + (ttl if ttl is not None else self.cache_ttl), payload)
        return payload

    # -- reads -------------------------------------------------------------

    def predictions(self, stop_id: str, limit: int = 10) -> list[dict]:
        """The next arrivals at one Red Line station, soonest first.

        The feed returns rows in the agency's own order and does not guarantee it
        is sorted, and a row with neither an arrival nor a departure time is a
        dropped trip, so both are handled rather than trusted.
        """
        if stop_id not in {pair[0] for pair in RED_LINE_STOPS}:
            raise ValueError(f"{stop_id!r} is not a Red Line station; "
                             "ask me for one of the 22 on the Red Line")
        wanted = max(1, min(int(limit), 20))
        payload = self._get("predictions", {
            "filter[stop]": stop_id,
            "filter[route]": RED_ROUTE,
            "page[limit]": str(wanted),
        })
        if "errors" in payload and not payload.get("data"):
            raise BostonError(f"MBTA rejected the request: {payload['errors'][0].get('detail')}")
        rows: list[dict] = []
        for item in payload.get("data") or []:
            attributes = item.get("attributes") or {}
            arrival = attributes.get("arrival_time") or attributes.get("departure_time")
            if not arrival:
                continue
            route = ((item.get("relationships") or {}).get("route") or {}).get("data") or {}
            direction = attributes.get("direction_id")
            rows.append({
                "arrival_time": str(arrival),
                "direction_id": direction,
                "destination": destination_for(stop_id, direction),
                "status": attributes.get("status"),
                "arrival_uncertainty_min": _uncertainty(attributes.get("arrival_uncertainty")),
                "last_trip": bool(attributes.get("last_trip")),
                "trip": ((item.get("relationships") or {}).get("trip") or {}).get("data", {}).get("id"),
                "route": route.get("id"),
            })
        rows.sort(key=lambda row: row["arrival_time"])
        if not rows:
            raise BostonNotFound(f"MBTA published no upcoming Red Line arrival at "
                                 f"{_station_name(stop_id)}")
        return rows

    def stop(self, stop_id: str) -> dict:
        """One station's own record: name, municipality, wheelchair boarding."""
        if stop_id not in {pair[0] for pair in RED_LINE_STOPS}:
            raise ValueError(f"{stop_id!r} is not a Red Line station")
        payload = self._get(f"stops/{stop_id}", {}, ttl=3600.0)
        if not payload.get("data"):
            raise BostonNotFound(f"MBTA has no record for {stop_id!r}")
        attributes = payload["data"].get("attributes") or {}
        return {
            "id": stop_id,
            "name": attributes.get("name") or _station_name(stop_id),
            "municipality": attributes.get("municipality"),
            "address": attributes.get("address"),
            "latitude": attributes.get("latitude"),
            "longitude": attributes.get("longitude"),
            "wheelchair_boarding": attributes.get("wheelchair_boarding"),
            "source": DATASET,
        }

    def alerts(self, stop_id: str | None) -> list[dict]:
        """Service alerts on the Red Line, or touching one station.

        With a `stop_id` the feed is filtered to that station; without one it is
        filtered to the route, which is what "any alerts on the Red Line" asks.
        """
        if stop_id is not None and stop_id not in {pair[0] for pair in RED_LINE_STOPS}:
            raise ValueError(f"{stop_id!r} is not a Red Line station")
        filters = {"filter[route]": RED_ROUTE}
        if stop_id is not None:
            filters["filter[stop]"] = stop_id
        payload = self._get("alerts", {**filters, "page[limit]": "10"}, ttl=300.0)
        rows: list[dict] = []
        for item in payload.get("data") or []:
            attributes = item.get("attributes") or {}
            periods = attributes.get("active_period") or []
            start = periods[0].get("start") if periods else None
            end = periods[0].get("end") if periods else None
            rows.append({
                "id": item.get("id"),
                "cause": attributes.get("cause"),
                "effect": attributes.get("effect"),
                "severity": attributes.get("severity"),
                "description": _one_line(attributes.get("description")),
                "header": attributes.get("header"),
                "short_header": attributes.get("short_header"),
                "timeframe": attributes.get("timeframe"),
                "url": attributes.get("url"),
                "active_from": start,
                "active_until": end,
            })
        # MBTA has no severity ordering it guarantees here, so the busiest alerts
        # (a closure or a shuttle outrank a planned single-track change) are put
        # first by the effect the rider cares about.
        order = {"closure": 0, "shuttle": 1, "detour": 2, "stop_moved": 3, "station_closure": 0}
        rows.sort(key=lambda row: (order.get(str(row.get("effect")).lower(), 5),
                                   str(row.get("active_from") or "")))
        return rows

    def timetable(self, stop_id: str, trips: int = DEFAULT_WINDOW_TRIPS) -> dict:
        """The published timetable for one station, grouped by hour of day.

        This is the free-data answer to "how bad is the peak", and it is the one
        question the free skills cannot answer from predictions alone: predictions
        only ever show the next few trains, so they carry no idea whether 8am is
        packed. The timetable is a week, so every hour of day gets a group and the
        median headway in that group is the honest figure.
        """
        if stop_id not in {pair[0] for pair in RED_LINE_STOPS}:
            raise ValueError(f"{stop_id!r} is not a Red Line station")
        wanted = max(100, min(int(trips), MAX_WINDOW_TRIPS))
        payload = self._get("schedules", {
            "filter[stop]": stop_id,
            "filter[route]": RED_ROUTE,
            "page[limit]": str(wanted),
        }, ttl=900.0)
        if "errors" in payload and not payload.get("data"):
            raise BostonError(f"MBTA rejected the request: {payload['errors'][0].get('detail')}")
        rows = payload.get("data") or []
        times: list[str] = []
        for item in rows:
            attributes = item.get("attributes") or {}
            when = attributes.get("departure_time") or attributes.get("arrival_time")
            if not when:
                continue
            # `2026-09-28T05:15:00-04:00` -> the local hour and minute, which is
            # the hour a rider experiences, not the hour in UTC.
            match = re.match(r"\d{4}-\d{2}-\d{2}T(\d{2}):(\d{2})", str(when))
            if not match:
                continue
            times.append(f"{int(match.group(1)):02d}:{int(match.group(2)):02d}")
        if not times:
            raise BostonNotFound(f"MBTA published no timetable rows for {_station_name(stop_id)}")
        return {
            "stop_id": stop_id,
            "name": _station_name(stop_id),
            "rows": len(times),
            "requested_rows": wanted,
            "truncated": len(rows) >= wanted,
            "departures_by_hour": _by_hour(times),
            "earliest": min(times),
            "latest": max(times),
            "source": DATASET,
        }

    # -- places ------------------------------------------------------------

    def stations(self) -> list[dict]:
        """The Red Line's 22 stations, in line order. No call: it is a fixed list."""
        rows = []
        for index, (stop_id, name) in enumerate(RED_LINE_STOPS):
            rows.append({"id": stop_id, "name": name, "position": index + 1,
                         "terminal": index in (0, len(RED_LINE_STOPS) - 1)})
        return rows


def _uncertainty(value) -> int | None:
    """MBTA's arrival_uncertainty in seconds, as whole minutes."""
    if value is None or value == "":
        return None
    try:
        seconds = float(value)
    except (TypeError, ValueError):
        return None
    return int(round(seconds / 60.0))


def _one_line(text) -> str:
    """MBTA's alert descriptions carry CRLF paragraphs; one line is enough here."""
    if not text:
        return ""
    return " ".join(str(text).split())


def _by_hour(times: list[str]) -> dict[str, int]:
    """Departures per clock hour, as a sorted mapping a renderer can walk."""
    counts: dict[str, int] = {}
    for value in times:
        hour = value[:2]
        counts[hour] = counts.get(hour, 0) + 1
    return {hour: counts[hour] for hour in sorted(counts)}


def headway_minutes(clock_times: list[str]) -> float | None:
    """The median gap in minutes between a list of `HH:MM` departures.

    A week of departures in one hour is a sorted list of clock times, so the gaps
    are differences between neighbours. The median is used rather than the mean
    because a single gap across a service change is minutes long and would drag an
    average far away from what a rider actually waits.
    """
    minutes = []
    for value in clock_times:
        match = re.match(r"^(\d{1,2}):(\d{2})$", value)
        if not match:
            continue
        minutes.append(int(match.group(1)) * 60 + int(match.group(2)))
    if len(minutes) < 2:
        return None
    minutes.sort()
    gaps = [minutes[index + 1] - minutes[index] for index in range(len(minutes) - 1)]
    gaps = [gap for gap in gaps if gap > 0]
    return median([float(gap) for gap in gaps]) if gaps else None
