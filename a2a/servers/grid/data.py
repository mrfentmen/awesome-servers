"""Read-only client for the Great Britain carbon intensity API (carbonintensity.org.uk).

Endpoints (keyless, verified live 2026-09-28):
  - /intensity                             the current half-hour, national
  - /intensity/{from}/fw48h                the forecast 48 hours forward
  - /intensity/{from}/fw24h                the forecast 24 hours forward
  - /intensity/{from}/pt24h                what was measured in the 24 hours before
  - /intensity/stats/{from}/{to}           statistics over a window
  - /regional                              every GB region, for the current half-hour
  - /regional/{regionid}                   one region   (see the note on this below)
  - /regional/postcode/{outward}           the region a British postcode sits in
  - /generation                            the national generation mix right now

Four things about this API shape the client:

1. The data arrives half-hourly and in UTC, with the window as `from`/`to` on every
   record. `intensity` is a `forecast` and an `actual` per half-hour, and `actual` is
   null ahead of the present — which is the whole distinction between a forecast skill
   and a measured one.
2. The path is fussy. `/intensity/forecast` on its own is a 400, as is the
   `/intensity/forecast/{from}/{to}` form the documentation implies; the working
   spelling is `/intensity/{from}/fw48h`, anchored on a moment. `/regional/{regionid}`
   is a 400 as well ("Missing Authentication Token"), so a single region is taken from
   the full `/regional` read rather than by a second request.
3. `/regional` only ever holds the current half-hour, so there is no regional history
   to be had here and the client does not pretend otherwise.
4. The generation mix is published in two places: `/generation` for the national mix,
   and per region inside `/regional`. Both are read from their own endpoint.

The band ("very low" to "very high") is read off each record, never derived from the
number: on a forecast record NESO widens the band for the forecast's own uncertainty,
so the same value can be "low" on one half-hour and "moderate" on another. Anything
this client computes itself — a mean, a count — is reported without a band.
"""

from __future__ import annotations

import os
import re
from datetime import datetime, timedelta, timezone

from a2a_kit import JsonApiClient, UpstreamError, utc_now_iso

BASE_URL = "https://api.carbonintensity.org.uk"

INTENSITY_PATH = "/intensity"
FORWARD_48H_PATH = "/intensity/{from}/fw48h"
FORWARD_24H_PATH = "/intensity/{from}/fw24h"
BACKWARD_24H_PATH = "/intensity/{from}/pt24h"
REGIONAL_PATH = "/regional"
REGIONAL_POSTCODE_PATH = "/regional/postcode/{outward}"
GENERATION_PATH = "/generation"

DATASET = "api.carbonintensity.org.uk"
PRODUCT = "Great Britain carbon intensity and generation mix"
SOURCE = "National Energy System Operator (NESO)"

#: The forecast is published to the half-hour, so 30s is fresh without hammering.
LIVE_TTL = 60.0
#: The regional view only ever holds the current half-hour, so it cannot outlive that.
REGIONAL_TTL = 60.0
#: What was measured in the past 24 hours does not change.
HISTORY_TTL = 3600.0

MAX_LISTED_SLOTS = 24
#: The feed's own bands, cleanest first, as it names them on every record.
INTENSITY_BANDS = ("very low", "low", "moderate", "high", "very high")
#: How many distribution regions NESO publishes for Great Britain.
REGION_COUNT = 18

#: A British outward code: one or two letters, a digit, an optional letter.
_OUTWARD_RE = re.compile(r"^([A-Z]{1,2}\d[A-Z\d]?)$", re.IGNORECASE)
_FUEL_RE = re.compile(r"^[a-z ]{2,24}$")

__all__ = [
    "BACKWARD_24H_PATH",
    "BASE_URL",
    "DATASET",
    "FORWARD_24H_PATH",
    "FORWARD_48H_PATH",
    "GENERATION_PATH",
    "HISTORY_TTL",
    "INTENSITY_BANDS",
    "INTENSITY_PATH",
    "LIVE_TTL",
    "MAX_LISTED_SLOTS",
    "PRODUCT",
    "REGIONAL_PATH",
    "REGIONAL_POSTCODE_PATH",
    "REGIONAL_TTL",
    "REGION_COUNT",
    "GridClient",
    "UpstreamError",
    "iso_minute",
    "parse_stamp",
]


def iso_minute(moment: datetime) -> str:
    """The `YYYY-MM-DDThh:mmZ` stamp this API's paths want, in UTC."""
    return moment.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%MZ")


def parse_stamp(value) -> datetime | None:
    """An API timestamp (`2026-09-29T02:00Z`) as an aware datetime."""
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None


class GridClient(JsonApiClient):
    env_prefix = "GRID"
    base_url = BASE_URL

    def __init__(self, fetch=None, base_url=None, cache_ttl=None, timeout=None, headers=None) -> None:
        super().__init__(fetch=fetch, base_url=base_url, cache_ttl=cache_ttl, timeout=timeout, headers=headers)
        self.live_ttl = float(os.environ.get(f"{self.env_prefix}_LIVE_TTL", LIVE_TTL))
        self.regional_ttl = float(os.environ.get(f"{self.env_prefix}_REGIONAL_TTL", REGIONAL_TTL))
        self.history_ttl = float(os.environ.get(f"{self.env_prefix}_HISTORY_TTL", HISTORY_TTL))

    # -- validation --------------------------------------------------------

    @staticmethod
    def check_outward(value) -> str:
        """A British outward code, such as SW1A, M1 or EH12.

        A full postcode is accepted and reduced to its outward code, because that is
        the only part the regional endpoint is keyed on and it is what a caller
        naturally has to hand.
        """
        raw = re.sub(r"\s+", " ", str(value).strip().upper())
        outward = raw.split(" ")[0] if " " in raw else raw
        if not _OUTWARD_RE.match(outward):
            raise ValueError("a British outward code looks like SW1A, M1 or EH12")
        return outward

    @staticmethod
    def check_hours(value) -> int:
        try:
            hours = int(value)
        except (TypeError, ValueError):
            raise ValueError("hours must be a whole number") from None
        if not 1 <= hours <= 48:
            raise ValueError("hours must be between 1 and 48 — that is how far this API forecasts")
        return hours

    @staticmethod
    def check_threshold(value) -> float:
        try:
            threshold = float(value)
        except (TypeError, ValueError):
            raise ValueError("a threshold is a number in gCO2/kWh") from None
        if not 0 <= threshold <= 1000:
            raise ValueError("a threshold must be between 0 and 1000 gCO2/kWh")
        return round(threshold, 1)

    @staticmethod
    def check_limit(value, maximum: int = MAX_LISTED_SLOTS) -> int:
        try:
            limit = int(value)
        except (TypeError, ValueError):
            raise ValueError("limit must be a whole number") from None
        if not 1 <= limit <= maximum:
            raise ValueError(f"limit must be between 1 and {maximum}")
        return limit

    @staticmethod
    def check_series(value) -> str:
        series = str(value or "forecast").strip().lower()
        if series not in ("forecast", "actual"):
            raise ValueError("series is `forecast` for what is published ahead, or `actual` for what has been measured")
        return series

    # -- transport ---------------------------------------------------------

    def _read(self, path: str, ttl: float) -> object:
        """One GET, with this API's JSON error envelope read into a message."""
        payload = self.get_json(path, {}, ttl=ttl)
        problem = (payload or {}).get("error") if isinstance(payload, dict) else None
        if isinstance(problem, dict) and problem.get("message"):
            raise UpstreamError(f"the Carbon Intensity API refused that request: {problem['message']}")
        if payload is None:
            raise UpstreamError("the Carbon Intensity API returned an empty body")
        return payload

    @staticmethod
    def _slot(row: dict) -> dict | None:
        """One half-hour of the series, as a flat row, or None if it has no value."""
        intensity = row.get("intensity") or {}
        forecast, actual = intensity.get("forecast"), intensity.get("actual")
        return {
            "from": row.get("from"),
            "to": row.get("to"),
            "forecast": forecast,
            "actual": actual,
            "value": forecast,
            "band": intensity.get("index"),
            "dataset": DATASET,
        }

    # -- national ----------------------------------------------------------

    def now(self) -> dict | None:
        """The current half-hour: what is forecast for it and what has been measured."""
        payload = self._read(INTENSITY_PATH, ttl=min(self.live_ttl, self.cache_ttl))
        rows = payload.get("data") if isinstance(payload, dict) else None
        if not rows:
            return None
        slot = self._slot(rows[-1])
        if slot is None:
            return None
        # Half-hourly cadence, so at most a quarter of an hour has passed since it began.
        start = parse_stamp(slot["from"])
        slot["minutes_in"] = int((datetime.now(timezone.utc) - start).total_seconds() // 60) if start else None
        slot["band"] = slot["band"] or "not reported"
        return slot

    def series(self, direction: str = "fw48h", hours: int = 48) -> list[dict]:
        """Half-hours going forward (`fw48h`, `fw24h`) or measured (`pt24h`).

        The API will only give 24 or 48 hours at a time, so a shorter request is a
        longer read trimmed here rather than a request the API refuses.
        """
        hours = self.check_hours(hours)
        if direction not in ("fw48h", "fw24h", "pt24h"):
            raise ValueError("direction is fw48h, fw24h or pt24h")
        # The paths are anchored on a moment; half an hour back keeps the half-hour in progress.
        anchor = datetime.now(timezone.utc) - timedelta(minutes=30)
        template = {
            "fw48h": FORWARD_48H_PATH,
            "fw24h": FORWARD_24H_PATH,
            "pt24h": BACKWARD_24H_PATH,
        }[direction]
        path = template.replace("{from}", iso_minute(anchor))
        ttl = min(self.live_ttl if direction.startswith("fw") else self.history_ttl, self.cache_ttl)
        payload = self._read(path, ttl=ttl)
        rows = payload.get("data") if isinstance(payload, dict) else None
        if rows is None:
            raise UpstreamError("the Carbon Intensity API returned an unexpected series payload")
        slots = [self._slot(row) for row in rows]
        return [slot for slot in slots if slot and slot["value"] is not None][: self.check_limit(hours * 2, 96)]

    def generation_mix(self) -> dict | None:
        """The national generation mix for the current half-hour, as published."""
        payload = self._read(GENERATION_PATH, ttl=min(self.live_ttl, self.cache_ttl))
        data = payload.get("data") if isinstance(payload, dict) else None
        if not isinstance(data, dict):
            return None
        return {
            "from": data.get("from"),
            "to": data.get("to"),
            "mix": self._mix(data.get("generationmix")),
            "dataset": DATASET,
        }

    @staticmethod
    def _mix(rows) -> list[dict]:
        """The generation mix, biggest share first, the feed's percentages as they stand."""
        mix = []
        for row in rows or []:
            fuel = row.get("fuel")
            share = row.get("perc")
            if not fuel or share is None:
                continue
            mix.append({"fuel": str(fuel).strip(), "percent": _to_float(share) or 0.0})
        mix.sort(key=lambda entry: (-entry["percent"], entry["fuel"]))
        return mix

    # -- regional ----------------------------------------------------------

    def regions(self) -> list[dict]:
        """Every GB region for the current half-hour.

        `/regional/{regionid}` answers 400 on this API, so one region is a filter over
        this list rather than a second request.
        """
        payload = self._read(REGIONAL_PATH, ttl=min(self.regional_ttl, self.cache_ttl))
        data = payload.get("data") if isinstance(payload, dict) else None
        if data is None:
            raise UpstreamError("the Carbon Intensity API returned an unexpected regional payload")
        windows = data if isinstance(data, list) else [data]
        rows = []
        for window in windows:
            for region in window.get("regions") or []:
                intensity = region.get("intensity") or {}
                rows.append({
                    "region_id": region.get("regionid"),
                    "dno": region.get("dnoregion"),
                    "short_name": region.get("shortname") or "name not reported",
                    "forecast": intensity.get("forecast"),
                    "band": intensity.get("index") or "not reported",
                    "mix": self._mix(region.get("generationmix")),
                    "from": window.get("from"),
                    "to": window.get("to"),
                    "dataset": DATASET,
                })
        return rows

    def region(self, region_id) -> dict | None:
        wanted = int(region_id) if str(region_id).strip().isdigit() else None
        if wanted is None:
            raise ValueError("a region id is the number the feed publishes, 1 to 18")
        for row in self.regions():
            if row["region_id"] == wanted:
                return row
        return None

    def region_for_postcode(self, postcode: str) -> dict | None:
        """The region a British postcode falls in, by its outward code.

        This endpoint nests one extra level: the region, and inside it the half-hour
        windows, each carrying its own intensity and generation mix.
        """
        outward = self.check_outward(postcode)
        try:
            payload = self._read(REGIONAL_POSTCODE_PATH.format(outward=outward),
                                 ttl=min(self.regional_ttl, self.cache_ttl))
        except UpstreamError as exc:
            # This endpoint answers HTTP 400 with "No postcode match can be found" for an
            # outward code it does not hold. That is a fact about the postcode, not a
            # broken feed, so it is None here rather than a failed task.
            if "400" in str(exc):
                return None
            raise
        data = payload.get("data") if isinstance(payload, dict) else None
        if not data:
            return None
        region = data[0] if isinstance(data, list) else data
        windows = region.get("data") or []
        if not windows:
            return None
        window = windows[-1]
        intensity = window.get("intensity") or {}
        return {
            "outward_code": region.get("postcode") or outward,
            "region_id": region.get("regionid"),
            "dno": region.get("dnoregion"),
            "short_name": region.get("shortname") or "name not reported",
            "forecast": intensity.get("forecast"),
            "band": intensity.get("index") or "not reported",
            "mix": self._mix(window.get("generationmix")),
            "from": window.get("from"),
            "to": window.get("to"),
            "dataset": DATASET,
        }

    # -- shared ------------------------------------------------------------

    @staticmethod
    def freshness() -> str:
        """The forecast and the regional view both move every half-hour."""
        return utc_now_iso()


def _to_float(value) -> float | None:
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None
