"""What time it is somewhere, and which zone that place is in.

Two sources, both keyless and both real. timeapi.io publishes the current wall
clock in any IANA timezone, and answers HTTP 400 "Invalid Timezone" for a zone it
does not hold. The IANA timezone database that ships with Python
(`zoneinfo.available_timezones()`, 598 zones read on 2026-09-28) is what turns a
place name into a zone, because timeapi has no reverse lookup and no list.

Verified live on 2026-09-28:

  /api/Time/current/zone?timeZone=Asia/Tokyo
      -> {"dateTime":"2026-09-29T13:07:52", "timeZone":"Asia/Tokyo", "dstActive":false}
  /api/Time/current/zone?timeZone=America/Santiago
      -> "2026-09-29T01:07:53", "dstActive":true
  /api/Time/current/zone?timeZone=Nowhere/Nothing
      -> HTTP 400, body "Invalid Timezone"

Three things these sources make plain and this reader keeps. timeapi publishes a
*wall clock* and no offset, so an offset has to be derived by comparing that wall
clock with UTC, and that is what `offset_minutes()` does. `dstActive` is the feed's
own flag for "summer time is in force in this zone right now" and it is not the
same thing as "this zone is currently on summer time" in reverse: a zone can be
observing summer time and still be many hours from UTC. And most IANA zone names
end in a city - `Asia/Tokyo`, `America/Santiago`, `Europe/London` - which is why a
place name can be resolved by matching the last component, and also why a place
with no city in its zone name (`Europe/Berlin` has one, `Asia/Qatar` does not)
cannot be resolved and is reported as unknown rather than guessed.
"""

from __future__ import annotations

import datetime
import json
import os
import re
import time
from urllib import parse, request
from urllib.error import HTTPError

API = "https://timeapi.io/api/Time/current/zone"

DATASET = "timeapi.io current time + the IANA timezone database"

DEFAULT_USER_AGENT = "awesome-acps-clock/1.0 (+https://github.com/mrfentmen/awesome-acps)"

#: Zones whose IANA name does not end in a city, so a place name will not match
#: them. They are listed so the answer can say "this zone exists but has no city in
#: its name" rather than pretending the place is unknown.
#: Read from `zoneinfo.available_timezones()` on 2026-09-28.
NAMELESS_ZONE_SAMPLES = ("Asia/Qatar", "Asia/Riyadh", "Etc/UTC", "Africa/Abidjan",
                         "Europe/Nicosia", "Asia/Singapore", "Africa/Algiers",
                         "America/Panama", "Asia/Hong_Kong")

#: A zone name is `Area/Location`, or `Area/Region/Location` where the region
#: matters - `America/Argentina/Buenos_Aires` is three parts, not two.
_ZONE_RE = re.compile(r"\b([A-Za-z]+(?:/[A-Za-z_+-]+){1,2})\b")

#: A city or place written as a word, used to resolve a zone from its name.
_PLACE_RE = re.compile(r"\b([A-Za-z][A-Za-z '.-]{1,40})\b")


class ClockError(RuntimeError):
    """The time feed could not be read."""


class ClockNotFound(ClockError):
    """The feed named no zone, or the IANA database has no such zone."""


#: The zone list and the city lookup are rebuilt on every call otherwise, and the
#: list has 598 entries, which made a single question take seconds.
_ZONE_CACHE: list[str] | None = None
_CITY_TO_ZONE: dict[str, str] | None = None


def available_zones() -> list[str]:
    """Every IANA zone this machine's database holds. Sorted for a stable answer.

    The list does not change while the process runs, so it is read once.
    """
    global _ZONE_CACHE
    if _ZONE_CACHE is None:
        try:
            import zoneinfo

            _ZONE_CACHE = sorted(zoneinfo.available_timezones())
        except Exception as exc:  # a zoneinfo database is not guaranteed everywhere
            raise ClockError(f"this machine has no IANA timezone database to resolve a place "
                             f"against ({exc})") from exc
    return _ZONE_CACHE


def zone_names() -> list[str]:
    """The city component of every zone, which is what a place name is matched on."""
    return [name.split("/")[-1] for name in available_zones()]


def _city_pattern() -> re.Pattern:
    """One pattern matching any zone's city component, on a word boundary.

    Two things this has to get right and a plain substring search gets wrong.
    A city name has to match on a **word boundary**, because `EET` sits inside
    "b-e-t-w-e-e-n" and a bare search for "eet" turns "between London and Tokyo"
    into three zones. And the alternatives are sorted **longest first**, so "New
    York" wins over a bare "York" at the same position.
    """
    global _CITY_PATTERN
    if _CITY_PATTERN is None:
        cities = sorted((name.split("/")[-1].replace("_", " ") for name in available_zones()),
                        key=len, reverse=True)
        _CITY_PATTERN = re.compile(
            r"(?<![A-Za-z])(?:" + "|".join(re.escape(city) for city in cities if city) + r")"
            r"(?![A-Za-z])",
            re.IGNORECASE,
        )
    return _CITY_PATTERN


#: Built once, because the pattern is 598 alternatives long and compiling it per
#: call would be the slowest thing in this agent.
_CITY_PATTERN: re.Pattern | None = None


def _zone_for_city(city: str) -> str | None:
    """The zone a city component belongs to, or None.

    The first zone that claims a city name wins, which is what a person means by
    "Santiago": the IANA database has no place called Santiago in any other zone, and
    where it did, alphabetical order is as good a rule as any.
    """
    global _CITY_TO_ZONE
    if _CITY_TO_ZONE is None:
        _CITY_TO_ZONE = {}
        for name in available_zones():
            _CITY_TO_ZONE.setdefault(name.split("/")[-1].replace("_", " ").lower(), name)
    return _CITY_TO_ZONE.get(city.lower())


def zone_from_text(text: str) -> tuple[str, str] | None:
    """A place or an IANA zone name as (zone, city), or None.

    An explicit `Area/City` wins over a place name, because a caller who wrote the
    zone out has already answered the question. Otherwise the city component of
    every zone is matched on a word boundary, so "Santiago" resolves and
    "between" does not.
    """
    stripped = " ".join(str(text or "").split())
    if not stripped:
        return None
    zones = available_zones()
    known = set(zones)

    explicit = _ZONE_RE.search(stripped)
    if explicit:
        candidate = explicit.group(1)
        if candidate in known:
            return candidate, candidate.split("/")[-1].replace("_", " ")
        for name in zones:
            if name.lower() == candidate.lower():
                return name, name.split("/")[-1].replace("_", " ")

    for match in _city_pattern().finditer(stripped):
        zone = _zone_for_city(match.group(0))
        if zone:
            return zone, zone.split("/")[-1].replace("_", " ")
    return None


def zones_in_order(text: str) -> list[tuple[str, str]]:
    """Every place in a question, in the order written, as (zone, city).

    A question can name several places - "what time is it in London and Tokyo?" -
    and the answer needs all of them, not just the first, in the order they were
    written. `finditer` over one boundary-checked pattern gives that order for
    free and cannot match one place's name inside another's.
    """
    found: list[tuple[str, str]] = []
    for match in _city_pattern().finditer(str(text or "")):
        zone = _zone_for_city(match.group(0))
        if not zone:
            continue
        entry = (zone, zone.split("/")[-1].replace("_", " "))
        if entry not in found:
            found.append(entry)
    return found


def offset_minutes(zone: str, utc: datetime.datetime) -> int | None:
    """A zone's current UTC offset in minutes, or None when there is no database.

    This is the stdlib's own tzdata read through `zoneinfo`, which is what follows
    the daylight-saving rule of the zone including its switch-over Sundays. It is
    a different source from the time feed on purpose: the feed publishes a wall
    clock and no offset, and the answer needs the offset.
    """
    try:
        from zoneinfo import ZoneInfo

        delta = utc.astimezone(ZoneInfo(zone)).utcoffset()
    except Exception:
        return None
    #: A zone on UTC has a zero offset, and `timedelta(0)` is falsy, so an
    #: `x or fallback` here would swallow it. The None is the only absent case.
    if delta is None:
        return None
    return int(delta.total_seconds()) // 60


def local_now(zone: str, utc: datetime.datetime) -> datetime.datetime | None:
    """`utc` as the wall clock in `zone`, or None when there is no database."""
    try:
        from zoneinfo import ZoneInfo

        return utc.astimezone(ZoneInfo(zone))
    except Exception:
        return None


class ClockData:
    """The current time in one zone, read from the time feed."""

    def __init__(self, fetch=None, cache_ttl: float = 5.0, timeout: float = 30.0,
                 user_agent: str | None = None) -> None:
        self.cache_ttl = float(os.environ.get("CLOCK_CACHE_TTL", cache_ttl))
        self.timeout = float(os.environ.get("CLOCK_HTTP_TIMEOUT", timeout))
        self.user_agent = (user_agent or os.environ.get("CLOCK_USER_AGENT")
                           or DEFAULT_USER_AGENT)
        self._fetch = fetch or self._http_json
        self._cache: dict[str, tuple[float, object]] = {}

    # -- transport ---------------------------------------------------------

    def _http_json(self, url: str, params: dict | None = None) -> object:
        query = f"{url}?{parse.urlencode(params, doseq=True)}" if params else url
        req = request.Request(query, headers={"User-Agent": self.user_agent,
                                              "Accept": "application/json"})
        try:
            with request.urlopen(req, timeout=self.timeout) as resp:
                body = resp.read().decode("utf-8", "replace")
        except HTTPError as exc:
            if exc.code == 400:
                #: Verified 2026-09-28: the feed answers HTTP 400 with the body
                #: "Invalid Timezone", which is a bad zone and not an outage.
                raise ClockNotFound("the time feed does not hold that timezone; it is not a "
                                    "valid IANA zone name") from exc
            raise ClockError(f"the time feed answered HTTP {exc.code}") from exc
        except Exception as exc:  # urllib raises many other types too
            raise ClockError(f"request failed: {exc}") from exc
        if not body.strip():
            return {}
        try:
            return json.loads(body)
        except ValueError as exc:
            raise ClockError(f"the time feed returned something that is not JSON: {exc}") from exc

    def _get(self, zone: str) -> dict:
        """One cached GET. A clock is worth a five-second cache at most."""
        cache_key = zone
        now = time.time()
        hit = self._cache.get(cache_key)
        if hit and hit[0] > now:
            return hit[1]
        payload = self._fetch(API, {"timeZone": zone})
        if isinstance(payload, (str, bytes)):
            try:
                payload = json.loads(payload)
            except ValueError as exc:
                raise ClockError(f"the time feed returned something that is not JSON: {exc}") from exc
        if not isinstance(payload, dict) or not payload:
            raise ClockNotFound(f"the time feed published no time for {zone}")
        self._cache[cache_key] = (now + self.cache_ttl, payload)
        return payload

    # -- reads -------------------------------------------------------------

    def now(self, zone: str) -> dict:
        """The current time in one zone, with the offset derived from UTC.

        The feed publishes a wall clock and no offset, so the offset is the
        difference between that wall clock and the current UTC instant, worked out
        through the IANA database. Both halves are stated, and `dstActive` is the
        feed's own flag rather than something this reader decided.
        """
        if zone not in _ZONE_SET():
            raise ClockNotFound(f"{zone} is not an IANA timezone name")
        payload = self._get(zone)
        utc = datetime.datetime.now(datetime.timezone.utc)
        local = local_now(zone, utc)
        offset = offset_minutes(zone, utc)
        return {
            "zone": zone,
            "city": zone.split("/")[-1].replace("_", " "),
            "feed_time": payload.get("time"),
            "feed_datetime": payload.get("dateTime"),
            "feed_date": payload.get("date"),
            "day_of_week": payload.get("dayOfWeek"),
            "dst_active": payload.get("dstActive"),
            "utc_now": utc.strftime("%Y-%m-%d %H:%M:%SZ"),
            "offset_minutes": offset,
            "offset": _offset_text(offset),
            "local_now": local.strftime("%Y-%m-%d %H:%M:%S") if local else None,
            "matches_feed": _agrees(local, payload.get("time")),
            "source": DATASET,
        }

    def compare(self, zones: list[str]) -> list[dict]:
        """The current time in each of several zones, in the order asked."""
        return [self.now(zone) for zone in zones]


def _ZONE_SET() -> set[str]:
    """The zone list as a set, for the membership test on every read."""
    return set(available_zones())


def _offset_text(minutes: int | None) -> str:
    """A UTC offset as `+09:00`, or `not reported` when there is no database."""
    if minutes is None:
        return "not reported"
    sign = "+" if minutes >= 0 else "-"
    total = abs(int(minutes))
    return f"{sign}{total // 60:02d}:{total % 60:02d}"


def _agrees(local: datetime.datetime | None, feed_time) -> bool | None:
    """Whether the wall clock and the IANA database agree, to the minute.

    A disagreement means the two sources have drifted - a feed with a bug, or a
    machine whose tzdata is years out - and it is reported rather than hidden,
    because an answer that silently picks one of two disagreeing clocks is worse
    than one that says they differ.
    """
    if local is None or not feed_time:
        return None
    return local.strftime("%H:%M") == str(feed_time)[:5]
