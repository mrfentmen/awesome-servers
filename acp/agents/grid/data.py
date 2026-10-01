"""How green Britain's electricity is right now, from the carbon intensity API (keyless).

Verified live on 2026-09-28, no key:

  /intensity                        -> 1 row: forecast 84, actual 97, index "moderate"
  /intensity/2026-09-28/2026-10-01  -> 145 half-hourly rows
  /regional                         -> 18 regions, each with its own intensity and mix
  /generation/2026-09-29/2026-09-30  -> 49 rows of generation mix by fuel
  /intensity/regional/<from>/<to>     -> HTTP 400 "Missing Authentication Token"

Three things these payloads make plain and this reader keeps. `intensity` is in
**grams of CO2 per kilowatt-hour**, and the number in the *future* rows of a
forecast window is `forecast` with `actual` set to `null` - a null actual is
"not happened yet", not "no emissions". Every timestamp ends in `Z`, so these are
UTC, and a half-hourly row stamped `23:30Z` is half past eleven at night in
London in winter, which is the arithmetic people get wrong most often. And
`/intensity/<a>/<b>` answers `null` with HTTP 200 for a date range it has no data
for, so a null body is a real "nothing here" and not a broken feed.

Two things on the same host are behind a token and answer HTTP 400 keyless, and
neither is offered here: `/emissions/...` and `/intensity/regional/<from>/<to>`. A
per-region *forecast* is therefore not answered at all, only the per-region
*current* reading that `/regional` publishes.
"""

from __future__ import annotations

import datetime
import json
import os
import re
import time
from urllib import parse, request
from urllib.error import HTTPError

API = "https://api.carbonintensity.org.uk/"

DATASET = "UK National Grid carbon intensity (api.carbonintensity.org.uk)"

DEFAULT_USER_AGENT = "awesome-acps-grid/1.0 (+https://github.com/mrfentmen/awesome-acps)"

#: The unit the feed publishes. Carbon intensity is grams of CO2 per kilowatt-hour,
#: and the reader never converts it: a converted number would not be comparable
#: with anything else anyone quotes.
UNIT = "gCO2/kWh"

#: The index the feed itself labels each reading with, worst-first. The thresholds
#: are the feed's, so this table is only used to explain a reading, never to
#: re-derive one.
INDEX_ORDER = ("very high", "high", "moderate", "low", "very low")

#: GB is the whole grid and the other seventeen rows are its regions; the national
#: figure is not the average of the regions, and the reader does not pretend it is.
NATIONAL_REGION = "GB"

#: The fuels the feed breaks generation down by, in the order it publishes them.
FUELS = ("biomass", "coal", "imports", "gas", "nuclear", "other", "hydro", "solar", "wind")

#: A half-hourly row is 30 minutes, which is what every duration in this file is
#: counted in.
SLOT_MINUTES = 30

#: The furthest a forecast window is read, which is 48 hours of half-hourly rows.
#: The feed holds a few days; asking for more than this returns rows it has and
#: the answer says how many it used.
MAX_WINDOW_DAYS = 4


class GridError(RuntimeError):
    """The carbon intensity API could not be read."""


class GridNotFound(GridError):
    """The feed answered 200 with no rows, or named no region - a real 'nothing here'."""


def _rows(payload: object) -> list[dict]:
    """The `data` rows of a response, whatever shape the feed used.

    The feed is not consistent: `/intensity` and `/regional` answer with `data` as
    a one-element list, and `/generation` answers with `data` as a bare object. Both
    are one half-hourly reading here, so the object is wrapped and both come back
    as the same list.
    """
    if isinstance(payload, (str, bytes)):
        try:
            payload = json.loads(payload)
        except ValueError as exc:
            raise GridError(f"the API returned something that is not JSON: {exc}") from exc
    if payload is None:
        return []
    if not isinstance(payload, dict):
        raise GridError("the API returned an unexpected payload")
    if payload.get("error"):
        raise GridError(f"the API refused the request: {payload['error'].get('message')}")
    data = payload.get("data")
    if isinstance(data, list):
        return [row for row in data if isinstance(row, dict)]
    if isinstance(data, dict):
        return [data]
    return []


def parse_utc(iso: str) -> datetime.datetime | None:
    """`2026-09-29T03:00Z` as an aware UTC datetime, or None when unreadable."""
    text = str(iso or "").strip()
    if not text:
        return None
    for pattern in ("%Y-%m-%dT%H:%MZ", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S.%fZ"):
        try:
            return datetime.datetime.strptime(text, pattern).replace(
                tzinfo=datetime.timezone.utc)
        except ValueError:
            continue
    return None


def london_time(iso: str) -> tuple[str, str] | None:
    """A UTC stamp as its UK local clock time, and the UK offset, or None.

    The feed publishes UTC only. A reader that prints a `23:30Z` row as 23:30 is
    wrong for most of the year in Britain, which is most of the reason a "clean
    window" gets misread. The offset comes from the stdlib's own zoneinfo, so it
    follows the UK rule including the switch-over Sundays, rather than a guess.
    """
    moment = parse_utc(iso)
    if moment is None:
        return None
    try:
        from zoneinfo import ZoneInfo

        local = moment.astimezone(ZoneInfo("Europe/London"))
    except Exception:  # a zoneinfo database is not guaranteed on every machine
        return moment.strftime("%H:%M"), "+00:00"
    offset = local.utcoffset() or datetime.timedelta(0)
    sign = "+" if offset >= datetime.timedelta(0) else "-"
    total = abs(int(offset.total_seconds())) // 60
    stamp = f"{sign}{total // 60:02d}:{total % 60:02d}"
    return local.strftime("%H:%M"), stamp


class GridData:
    """The national intensity, the forecast, the regions and the generation mix."""

    def __init__(self, fetch=None, cache_ttl: float = 600.0, timeout: float = 40.0,
                 user_agent: str | None = None) -> None:
        self.cache_ttl = float(os.environ.get("GRID_CACHE_TTL", cache_ttl))
        self.timeout = float(os.environ.get("GRID_HTTP_TIMEOUT", timeout))
        self.user_agent = (user_agent or os.environ.get("GRID_USER_AGENT")
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
                raise GridNotFound("the API has no record for that") from exc
            raise GridError(f"the API answered HTTP {exc.code}") from exc
        except Exception as exc:  # urllib raises many other types too
            raise GridError(f"request failed: {exc}") from exc
        if not body.strip():
            return None
        try:
            return json.loads(body)
        except ValueError as exc:
            raise GridError(f"the API returned something that is not JSON: {exc}") from exc

    def _get(self, path: str, ttl: float | None = None) -> list[dict]:
        """One cached GET. Intensity moves every half hour, so the cache is short."""
        cache_key = f"{API}{path}"
        now = time.time()
        hit = self._cache.get(cache_key)
        if hit and hit[0] > now:
            return hit[1]
        rows = _rows(self._fetch(cache_key))
        self._cache[cache_key] = (now + (ttl if ttl is not None else self.cache_ttl), rows)
        return rows

    # -- reads -------------------------------------------------------------

    def now(self) -> dict:
        """The current national reading: forecast, actual, index, and local time."""
        rows = self._get("intensity", ttl=300.0)
        if not rows:
            raise GridNotFound("the API published no current intensity reading")
        row = rows[0]
        intensity = row.get("intensity") or {}
        local, offset = london_time(row.get("from")) or (None, None)
        return {
            "from": row.get("from"),
            "to": row.get("to"),
            "local_time": local,
            "uk_offset": offset,
            "forecast": _number(intensity.get("forecast")),
            "actual": _number(intensity.get("actual")),
            "index": intensity.get("index") or "not reported",
            "unit": UNIT,
            "source": DATASET,
        }

    def generation_now(self) -> dict:
        """The generation mix for the current half hour, by fuel."""
        rows = self._get("generation", ttl=300.0)
        if not rows:
            raise GridNotFound("the API published no current generation mix")
        row = rows[0]
        local, offset = london_time(row.get("from")) or (None, None)
        return {
            "from": row.get("from"),
            "to": row.get("to"),
            "local_time": local,
            "uk_offset": offset,
            "mix": _mix(row.get("generationmix")),
            "source": DATASET,
        }

    def forecast(self, days: int = 1) -> dict:
        """The published national forecast, one row per half hour, and its index run.

        A `days` question is turned into a UTC date range rather than a row count,
        because the feed is keyed by date. Rows whose `actual` is null are the ones
        that have not happened yet, and they are counted separately so a reader
        cannot mistake a future row for a measured one.
        """
        span = max(1, min(int(days), MAX_WINDOW_DAYS))
        today = datetime.datetime.now(datetime.timezone.utc).date()
        start = today
        end = today + datetime.timedelta(days=span)
        rows = self._get(f"intensity/{start.isoformat()}/{end.isoformat()}", ttl=600.0)
        if not rows:
            #: The feed answers 200 with a null body for a range it holds no data
            #: for, which is a real "nothing here" rather than a broken feed.
            raise GridNotFound(f"the API published no forecast rows for "
                               f"{start.isoformat()} to {end.isoformat()}")
        slots = []
        for row in rows:
            intensity = row.get("intensity") or {}
            local, offset = london_time(row.get("from")) or (None, None)
            slots.append({
                "from": row.get("from"),
                "to": row.get("to"),
                "local_time": local,
                "uk_offset": offset,
                "forecast": _number(intensity.get("forecast")),
                "actual": _number(intensity.get("actual")),
                "index": intensity.get("index") or "not reported",
            })
        slots.sort(key=lambda slot: str(slot["from"]))
        measured = [slot for slot in slots if slot["actual"] is not None]
        pending = [slot for slot in slots if slot["actual"] is None]
        return {
            "start": start.isoformat(),
            "end": end.isoformat(),
            "days": span,
            "slots": slots,
            "count": len(slots),
            "measured": len(measured),
            "not_yet_happened": len(pending),
            "unit": UNIT,
            "source": DATASET,
        }

    def regions(self) -> dict:
        """All 18 regions with their current intensity and generation mix."""
        rows = self._get("regional", ttl=300.0)
        if not rows:
            raise GridNotFound("the API published no regional breakdown")
        row = rows[0]
        local, offset = london_time(row.get("from")) or (None, None)
        regions = []
        for entry in row.get("regions") or []:
            intensity = entry.get("intensity") or {}
            regions.append({
                "region_id": entry.get("regionid"),
                "short_name": entry.get("shortname") or "not reported",
                "full_name": entry.get("dnoregion") or "not reported",
                "forecast": _number(intensity.get("forecast")),
                "index": intensity.get("index") or "not reported",
                "mix": _mix(entry.get("generationmix")),
            })
        regions.sort(key=lambda entry: (entry["forecast"] is None, entry["forecast"]))
        if not regions:
            raise GridNotFound("the regional breakdown carried no region rows")
        return {
            "from": row.get("from"),
            "to": row.get("to"),
            "local_time": local,
            "uk_offset": offset,
            "regions": regions,
            "count": len(regions),
            "national": next((entry for entry in regions
                              if entry["short_name"] == NATIONAL_REGION), None),
            "unit": UNIT,
            "source": DATASET,
        }


def _number(value) -> int | None:
    """A published reading as an int, or None when the feed published nothing.

    A null `actual` is the feed saying "this half hour has not happened yet", and
    turning it into 0 would report a day of zero emissions.
    """
    if value is None or value == "":
        return None
    try:
        return int(round(float(value)))
    except (TypeError, ValueError):
        return None


def _mix(entries) -> dict[str, float | None]:
    """A generation mix as fuel -> percent, with every fuel present or null.

    The feed publishes nine fuels in a different key order on different rows, so the
    list is re-keyed here and a fuel it left out is reported as null rather than
    dropped, so "coal" is never read as absent when it is merely zero.
    """
    mix: dict[str, float | None] = {fuel: None for fuel in FUELS}
    for entry in entries or []:
        fuel = str(entry.get("fuel") or "").lower()
        if not fuel:
            continue
        try:
            mix[fuel] = round(float(entry.get("perc")), 1)
        except (TypeError, ValueError):
            mix[fuel] = None
    return mix
