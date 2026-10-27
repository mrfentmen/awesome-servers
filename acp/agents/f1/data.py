"""The F1 calendar, results, standings and drivers, from Jolpica/Ergast (keyless).

Verified live on 2026-09-28:

  https://api.jolpi.ca/ergast/f1/2026/next/
      -> MRData.RaceTable.Races[0]: round 16, 'Bahrain Grand Prix in Malaysia', Sepang,
         2026-10-04 07:00:00Z, with FirstPractice/Qualifying/Race sub-objects
  https://api.jolpi.ca/ergast/f1/current/driverStandings.json
      -> StandingsLists[0] season 2026, round 15, 'antonelli' P1 on 302 points, 8 wins
  https://api.jolpi.ca/ergast/f1/current/last/results.json?limit=3
      -> round 15 Azerbaijan Grand Prix: Russell P1 in 1:38:02.143 over 51 laps
  https://api.jolpi.ca/ergast/f1/2026/constructorstandings.json
      -> Mercedes 538, Ferrari 378
  https://api.jolpi.ca/ergast/f1/drivers/max_verstappen.json
      -> driverId 'max_verstappen', permanentNumber 3, born 1997-09-30, Dutch

Three things the payloads make plain and this reader keeps. The whole feed is wrapped in
`MRData`, and `RaceTable` is capitalised - the XML-derived JSON has a capital-R key that a
lowercase guess misses. A driver has **no** nationality-to-country-flag promise, and
`Time` is absent for a driver who did not finish, so a result with no time is reported as no
time. And `current` is the season Ergast considers current, which is read from the payload
rather than guessed from today's date, so a December answer in a November season is right.
"""

from __future__ import annotations

import json
import os
import re
import time
from urllib import parse, request
from urllib.error import HTTPError

API = "https://api.jolpi.ca/ergast/f1"

DATASET = "Jolpica/Ergast F1 (api.jolpi.ca/ergast)"

DEFAULT_USER_AGENT = "awesome-acps-f1/1.0 (+https://github.com/mrfentmen/awesome-acps)"

#: The sub-sessions of a race weekend, in the order a weekend runs.
SESSIONS = (("FirstPractice", "practice"), ("SecondPractice", "practice 2"),
            ("Qualifying", "qualifying"), ("ThirdPractice", "practice 3"),
            ("Sprint", "sprint"), ("Race", "race"))


class F1Error(RuntimeError):
    """The F1 feed could not be read."""


class F1NotFound(F1Error):
    """The feed answered 404, or knows no such driver - a real 'nothing here', not a failure."""


#: Words that are part of asking rather than part of a driver's name.
_ASKING = frozenset("""
about after and are did does for from have how in into is it last me much next now of on or
please season tell the this to up was were what when where which who whom why will wins won
with year
""".split())


def driver_from_text(text: str) -> str | None:
    """A driverId like `max_verstappen`, or a name an editor wrote.

    The feed's own key is the snake_case surname, so "max verstappen" and "max_verstappen"
    both land on the right one. The two name words are the *last* two non-asking words,
    because "tell me about Lewis Hamilton" starts with a question and "lewis" is not the
    driver. A first name on its own is not enough: two drivers have been called Fernando.
    """
    work = str(text or "").lower()
    match = re.search(r"\b([a-z]+_[a-z]+)\b", work)
    if match:
        return match.group(1)
    words = [word.strip("?!.,;:'\"") for word in work.split()]
    names = [word for word in words
             if re.fullmatch(r"[a-z]{3,}", word) and word not in _ASKING]
    if len(names) < 2:
        return None
    return f"{names[-2]}_{names[-1]}"


def _season(text: str) -> str:
    """A season written as a year, or the current one."""
    match = re.search(r"\b(19[5-9]\d|20\d\d|21\d\d)\b", str(text or ""))
    return match.group(1) if match else "current"


def _utc(stamp: str | None) -> str:
    """An Ergast time as "07:00 UTC", or the honest 'not published'."""
    if not stamp:
        return "time not published"
    return str(stamp).replace("Z", " UTC")


class F1Data:
    """The calendar, the last result, the standings and one driver's record."""

    def __init__(self, fetch=None, cache_ttl: float = 900.0, timeout: float = 25.0,
                 user_agent: str | None = None) -> None:
        self.cache_ttl = float(os.environ.get("F1_CACHE_TTL", cache_ttl))
        self.timeout = float(os.environ.get("F1_HTTP_TIMEOUT", timeout))
        self.user_agent = (user_agent or os.environ.get("F1_USER_AGENT")
                           or DEFAULT_USER_AGENT)
        self._fetch = fetch or self._http_text
        self._cache: dict[str, tuple[float, object]] = {}

    # -- transport ---------------------------------------------------------

    def _http_text(self, url: str) -> str:
        req = request.Request(url, headers={"User-Agent": self.user_agent, "Accept": "*/*"})
        try:
            with request.urlopen(req, timeout=self.timeout) as resp:
                return resp.read().decode("utf-8", "replace")
        except HTTPError as exc:
            raise F1NotFound(f"request failed: {exc}") from exc
        except Exception as exc:  # urllib raises many other types too
            raise F1Error(f"request failed: {exc}") from exc

    def _get(self, url: str, ttl: float | None = None) -> object:
        now = time.time()
        hit = self._cache.get(url)
        if hit and hit[0] > now:
            return hit[1]
        payload = self._fetch(url)
        if isinstance(payload, (str, bytes)):
            try:
                payload = json.loads(payload)
            except ValueError as exc:
                raise F1Error(f"the F1 feed returned something that is not JSON: {exc}") from exc
        self._cache[url] = (now + (ttl if ttl is not None else self.cache_ttl), payload)
        return payload

    @staticmethod
    def _mrdata(payload: object, what: str) -> dict:
        """The `MRData` envelope, which is where every Ergast answer actually lives."""
        if not isinstance(payload, dict) or not isinstance(payload.get("MRData"), dict):
            raise F1Error(f"the F1 feed returned no {what} in the MRData envelope")
        return payload["MRData"]

    # -- reads -------------------------------------------------------------

    @staticmethod
    def _clean_race(race: dict) -> dict:
        circuit = race.get("Circuit") or {}
        location = circuit.get("Location") or {}
        sessions = {}
        for key, label in SESSIONS:
            block = race.get(key)
            if isinstance(block, dict) and block.get("date"):
                sessions[label] = f"{block['date']} {_utc(block.get('time'))}"
        return {
            "season": str(race.get("season") or "not reported"),
            "round": str(race.get("round") or "not reported"),
            "name": race.get("raceName") or "not reported",
            "date": race.get("date") or "not published",
            "time": _utc(race.get("time")),
            "circuit": circuit.get("circuitName") or "not reported",
            "place": ", ".join(bit for bit in (location.get("locality"), location.get("country"))
                               if bit) or "not reported",
            "sessions": sessions,
            "url": race.get("url"),
        }

    @staticmethod
    def _clean_driver(driver: dict) -> dict:
        given = driver.get("givenName") or ""
        family = driver.get("familyName") or ""
        return {
            "driver_id": driver.get("driverId"),
            "name": f"{given} {family}".strip() or "not reported",
            "code": driver.get("code"),
            "number": driver.get("permanentNumber"),
            "nationality": driver.get("nationality") or "not reported",
            "born": driver.get("dateOfBirth") or "not published",
            "url": driver.get("url"),
        }

    def next_race(self, season: str = "current") -> dict:
        """The next race, with every session the weekend has."""
        base = f"{API}/{season}"
        payload = self._get(f"{base}/next.json", ttl=300.0)
        mrdata = self._mrdata(payload, "next race")
        races = (mrdata.get("RaceTable") or {}).get("Races")
        if not races:
            #: The season is over. That is a real answer, not a missing feed.
            return {"season": season, "races": [], "message": "the feed names no next race"}
        return {"season": season, "races": [self._clean_race(race) for race in races],
                "message": None}

    def last_result(self, season: str = "current", limit: int = 10) -> dict:
        """The most recent race that has been run, with its finishing order."""
        base = f"{API}/{season}"
        payload = self._get(f"{base}/last/results.json?limit={max(1, min(int(limit), 30))}",
                            ttl=300.0)
        mrdata = self._mrdata(payload, "last result")
        races = (mrdata.get("RaceTable") or {}).get("Races")
        if not races:
            raise F1NotFound("no race has been run yet this season")
        race = self._clean_race(races[0])
        results = []
        for row in (races[0].get("Results") or []):
            driver = self._clean_driver(row.get("Driver") or {})
            fastest = row.get("FastestLap") or {}
            results.append({
                "position": row.get("position") or "not reported",
                "driver": driver["name"],
                "driver_id": driver["driver_id"],
                "constructor": (row.get("Constructor") or {}).get("name"),
                "points": row.get("points"),
                "laps": row.get("laps"),
                "grid": row.get("grid"),
                #: A driver who did not finish has no Time at all in the feed.
                "time": (row.get("Time") or {}).get("time") or "did not finish",
                "status": row.get("status"),
                "fastest_lap": (f"lap {fastest.get('lap')}" if fastest.get("lap") else None),
            })
        race["results"] = results
        return race

    def driver_standings(self, season: str = "current", limit: int = 20) -> dict:
        """The drivers' championship table."""
        base = f"{API}/{season}"
        payload = self._get(f"{base}/driverStandings.json?limit={max(1, min(int(limit), 40))}")
        mrdata = self._mrdata(payload, "driver standings")
        lists = (mrdata.get("StandingsTable") or {}).get("StandingsLists")
        if not lists:
            raise F1NotFound(f"the feed publishes no driver standings for {season}")
        table = lists[0]
        rows = []
        for row in (table.get("DriverStandings") or []):
            driver = self._clean_driver(row.get("Driver") or {})
            rows.append({
                "position": row.get("position") or "not reported",
                "driver": driver["name"],
                "driver_id": driver["driver_id"],
                "code": driver["code"],
                "constructor": (row.get("Constructors") or [{}])[0].get("name"),
                "points": row.get("points"),
                "wins": row.get("wins"),
            })
        return {"season": str(table.get("season") or season),
                "round": str(table.get("round") or "not reported"), "rows": rows}

    def constructor_standings(self, season: str = "current", limit: int = 12) -> dict:
        """The constructors' championship table."""
        base = f"{API}/{season}"
        payload = self._get(
            f"{base}/constructorstandings.json?limit={max(1, min(int(limit), 30))}")
        mrdata = self._mrdata(payload, "constructor standings")
        lists = (mrdata.get("StandingsTable") or {}).get("StandingsLists")
        if not lists:
            raise F1NotFound(f"the feed publishes no constructor standings for {season}")
        table = lists[0]
        rows = []
        for row in (table.get("ConstructorStandings") or []):
            rows.append({
                "position": row.get("position") or "not reported",
                "constructor": (row.get("Constructor") or {}).get("name") or "not reported",
                "points": row.get("points"),
                "wins": row.get("wins"),
            })
        return {"season": str(table.get("season") or season),
                "round": str(table.get("round") or "not reported"), "rows": rows}

    def driver(self, driver_id: str) -> dict:
        """One driver's own record, plus where they sit in the championship."""
        text = str(driver_id or "").strip()
        if not text:
            raise ValueError("tell me which driver, for example max_verstappen")
        payload = self._get(f"{API}/drivers/{parse.quote(text)}.json")
        mrdata = self._mrdata(payload, "driver")
        drivers = (mrdata.get("DriverTable") or {}).get("Drivers")
        if not drivers:
            raise F1NotFound(f"the feed knows no driver called {text!r}")
        driver = self._clean_driver(drivers[0])
        if not driver["driver_id"]:
            raise F1NotFound(f"the feed knows no driver called {text!r}")
        #: The feed has no lookup by name, so the id it returned is the record's own key.
        driver["key"] = driver["driver_id"]
        return driver
