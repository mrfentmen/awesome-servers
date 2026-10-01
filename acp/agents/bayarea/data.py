"""BART - the next train out of a Bay Area station, and how late it is running.

BART publishes its real-time departure board (ETD) at api.bart.gov, and the demo key
that feed's own documentation hands out answers it keylessly. Verified live on
2026-09-28:

  /etd.aspx?cmd=etd&orig=EMBR&key=...&json=y
      -> Embarcadero, 6 trains, estimate[].minutes "13" then "Leaving"
  /stn.aspx?cmd=stns&key=...&json=y
      -> 50 stations, each with `name`, `abbr`, `city`, `state`, `gtfs_latitude`

Three things the payloads make plain and this reader keeps. BART refuses a station
*name* and accepts only the four-letter `abbr` ("EMBR", "MLPT"), so a name has to
be turned into an abbr before any call, and the 50-station table is that mapping -
read once from `stn.aspx`, not hand-written. `estimate[].minutes` is the string
`"Leaving"` for the train pulling in right now and a number of minutes for the
rest, so reading it as an integer throws away the first train. And `delay` is not
a flag: it is the offset in seconds the feed believes the train is running at, so a
positive 600 means ten minutes late, not "on time".

`stn.aspx` was answering HTTP 500 for several minutes on 2026-09-28 and then
recovered, so a caller must treat a 500 there as transient rather than as a dead
feed; `etd.aspx` answered 200 throughout.
"""

from __future__ import annotations

import json
import os
import re
import time
from urllib import parse, request
from urllib.error import HTTPError

API = "https://api.bart.gov/api/"

DATASET = "BART public API (api.bart.gov)"

#: BART publishes this demo key in its own API documentation for the ETD feed. It
#: is a public demo key, not a secret, and it is overridable so a caller with their
#: own key is not forced onto it.
DEFAULT_KEY = "MW9S-E7SL-26DU-VV8V"

DEFAULT_USER_AGENT = "awesome-acps-bayarea/1.0 (+https://github.com/mrfentmen/awesome-acps)"

#: BART's 50 stations, `(abbr, name)`, read live from
#: `/stn.aspx?cmd=stns&json=y` on 2026-09-28. BART's ETD feed accepts only the
#: abbr, so this table is what turns "Embarcadero" into "EMBR".
BART_STATIONS: tuple[tuple[str, str], ...] = (
    ("12TH", "12th St. Oakland City Center"),
    ("16TH", "16th St. Mission"),
    ("19TH", "19th St. Oakland"),
    ("24TH", "24th St. Mission"),
    ("ANTC", "Antioch"),
    ("ASHB", "Ashby"),
    ("BALB", "Balboa Park"),
    ("BAYF", "Bay Fair"),
    ("BERY", "Berryessa/North San Jose"),
    ("CAST", "Castro Valley"),
    ("CIVC", "Civic Center/UN Plaza"),
    ("COLS", "Coliseum"),
    ("COLM", "Colma"),
    ("CONC", "Concord"),
    ("DALY", "Daly City"),
    ("DBRK", "Downtown Berkeley"),
    ("DELN", "El Cerrito del Norte"),
    ("DUBL", "Dublin/Pleasanton"),
    ("PLZA", "El Cerrito Plaza"),
    ("EMBR", "Embarcadero"),
    ("FRMT", "Fremont"),
    ("FTVL", "Fruitvale"),
    ("GLEN", "Glen Park"),
    ("HAYW", "Hayward"),
    ("LAFY", "Lafayette"),
    ("LAKE", "Lake Merritt"),
    ("MCAR", "MacArthur"),
    ("MLBR", "Millbrae"),
    ("MLPT", "Milpitas"),
    ("MONT", "Montgomery St."),
    ("NBRK", "North Berkeley"),
    ("NCON", "North Concord/Martinez"),
    ("OAKL", "Oakland International Airport"),
    ("ORIN", "Orinda"),
    ("PITT", "Pittsburg/Bay Point"),
    ("PCTR", "Pittsburg Center"),
    ("PHIL", "Pleasant Hill/Contra Costa Centre"),
    ("POWL", "Powell St."),
    ("RICH", "Richmond"),
    ("ROCK", "Rockridge"),
    ("SBRN", "San Bruno"),
    ("SFIA", "San Francisco International Airport"),
    ("SANL", "San Leandro"),
    ("SHAY", "South Hayward"),
    ("SSAN", "South San Francisco"),
    ("UCTY", "Union City"),
    ("WCRK", "Walnut Creek"),
    ("WARM", "Warm Springs/South Fremont"),
    ("WDUB", "West Dublin/Pleasanton"),
    ("WOAK", "West Oakland"),
)

#: The word BART puts in `estimate[].minutes` for the train that is pulling in now.
LEAVING = "Leaving"

#: BART's platform numbers are letters, and the board's two directions are named
#: after the line they head for ("North", "South", "East", "West").
DIRECTIONS = ("North", "South", "East", "West")


class BartError(RuntimeError):
    """BART's API could not be read."""


class BartNotFound(BartError):
    """BART named no station, or published no train - a real 'nothing here'."""


def median(values: list[float]) -> float | None:
    """The middle value, without importing statistics for one line."""
    if not values:
        return None
    ordered = sorted(values)
    middle = len(ordered) // 2
    if len(ordered) % 2:
        return ordered[middle]
    return (ordered[middle - 1] + ordered[middle]) / 2


def station_from_text(text: str) -> tuple[str, str] | None:
    """A BART station as (abbr, name), from its name or a raw four-letter abbr.

    Names are matched longest first, so "Dublin/Pleasanton" wins over
    "Pleasant Hill" and "West Oakland" over "Oakland". An unknown name returns
    None, and the agent then asks which station rather than guessing one.
    """
    stripped = " ".join(str(text or "").lower().split())
    if not stripped:
        return None
    for abbr, name in sorted(BART_STATIONS, key=lambda pair: -len(pair[1])):
        if name.lower() in stripped:
            return abbr, name
    for abbr, name in BART_STATIONS:
        if re.search(rf"\b{re.escape(abbr.lower())}\b", stripped):
            return abbr, name
    #: BART's own abbreviations are four letters, and a bare four-letter token in a
    #: station question is one. It is checked last so a spelled-out name always
    #: wins over a word that happens to be four letters.
    match = re.search(r"\b([A-Z]{4})\b", str(text or ""))
    if match:
        abbr = match.group(1)
        for station_abbr, name in BART_STATIONS:
            if station_abbr == abbr:
                return abbr, name
    return None


def all_stations() -> list[dict]:
    """The 50 stations with their abbrs. No call: it is a fixed table."""
    return [{"abbr": abbr, "name": name, "position": index + 1}
            for index, (abbr, name) in enumerate(BART_STATIONS)]


def minutes_from_board(value) -> float | None:
    """`estimate[].minutes` as a number, with `"Leaving"` read as 0.

    BART publishes the string `Leaving` for the train already at the platform.
    Taking that as an integer throws the first train away, which is the one a
    rider standing there most wants to know about.
    """
    text = str(value if value is not None else "").strip()
    if not text:
        return None
    if text.lower() == LEAVING.lower():
        return 0.0
    try:
        return float(text)
    except ValueError:
        return None


class BartData:
    """One station's real-time departure board, and BART's station list."""

    def __init__(self, fetch=None, key: str | None = None, cache_ttl: float = 20.0,
                 timeout: float = 40.0, user_agent: str | None = None) -> None:
        self.cache_ttl = float(os.environ.get("BAYAREA_CACHE_TTL", cache_ttl))
        self.timeout = float(os.environ.get("BAYAREA_HTTP_TIMEOUT", timeout))
        self.key = (key or os.environ.get("BART_API_KEY") or DEFAULT_KEY).strip()
        self.user_agent = (user_agent or os.environ.get("BAYAREA_USER_AGENT")
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
            if exc.code in (400, 404):
                raise BartNotFound(f"BART refused that request (HTTP {exc.code})") from exc
            # stn.aspx returned HTTP 500 for minutes on 2026-09-28 and then
            # recovered, so a 500 here is a wobble in the feed, not a dead feed.
            raise BartError(f"BART answered HTTP {exc.code}; its station-list endpoint "
                            f"does return 500 sometimes and then comes back") from exc
        except Exception as exc:  # urllib raises many other types too
            raise BartError(f"request failed: {exc}") from exc
        if not body.strip():
            return {}
        try:
            return json.loads(body)
        except ValueError as exc:
            raise BartError(f"BART returned something that is not JSON: {exc}") from exc

    def _get(self, path: str, params: dict, ttl: float | None = None) -> dict:
        """One cached GET, keyed on the full query so two calls never share a row."""
        full = {**params, "key": self.key, "json": "y"}
        cache_key = f"{path}?{parse.urlencode(full)}"
        now = time.time()
        hit = self._cache.get(cache_key)
        if hit and hit[0] > now:
            return hit[1]
        payload = self._fetch(f"{API}{path}", full)
        if isinstance(payload, (str, bytes)):
            try:
                payload = json.loads(payload)
            except ValueError as exc:
                raise BartError(f"BART returned something that is not JSON: {exc}") from exc
        if not isinstance(payload, dict):
            raise BartError("BART returned an unexpected payload")
        self._cache[cache_key] = (now + (ttl if ttl is not None else self.cache_ttl), payload)
        return payload

    # -- reads -------------------------------------------------------------

    def board(self, abbr: str) -> dict:
        """The departure board for one station, soonest train first.

        BART publishes up to six trains, each with a list of `estimate` rows: a
        train that is running normally gets one, and a train that has slipped off
        schedule can get several, so the earliest estimate is the one that is
        actually next and the rest are the delays behind it.
        """
        if abbr not in {pair[0] for pair in BART_STATIONS}:
            raise ValueError(f"{abbr!r} is not a BART station abbreviation")
        payload = self._get("etd.aspx", {"cmd": "etd", "orig": abbr})
        self._raise_on_message(payload)
        stations = ((payload.get("root") or {}).get("station")) or []
        if not stations:
            raise BartNotFound(f"BART published no departure board for {abbr}")
        station = stations[0]
        feed_date = (payload.get("root") or {}).get("date")
        feed_time = (payload.get("root") or {}).get("time")

        trains: list[dict] = []
        for entry in station.get("etd") or []:
            estimates = []
            for estimate in entry.get("estimate") or []:
                minutes = minutes_from_board(estimate.get("minutes"))
                if minutes is None:
                    continue
                # Every one of these fields hangs off the ESTIMATE, not off the
                # train: a train running late publishes several estimates, and each
                # one carries its own platform, direction, length and delay.
                estimates.append({
                    "minutes": minutes,
                    "leaving_now": minutes == 0.0,
                    "platform": estimate.get("platform"),
                    "direction": estimate.get("direction"),
                    "cars": _cars(estimate.get("length")),
                    "bikes_allowed": str(estimate.get("bikeflag") or "0") == "1",
                    "colour": estimate.get("color"),
                    "delay_seconds": _delay(estimate.get("delay")),
                    "cancelled": str(estimate.get("cancelflag") or "0") == "1",
                    "dynamic": str(estimate.get("dynamicflag") or "0") == "1",
                })
            if not estimates:
                #: BART can publish a train with no usable estimate. It is still a
                #: train on the board, so it is reported as one with no time.
                trains.append({
                    "destination": entry.get("destination") or "not reported",
                    "destination_abbr": entry.get("abbreviation"),
                    "direction": None,
                    "platform": None,
                    "cars": None,
                    "bikes_allowed": None,
                    "limited": str(entry.get("limited") or "0") == "1",
                    "colour": None,
                    "estimates": [],
                    "minutes": None,
                    "delay_seconds": None,
                    "cancelled": False,
                })
                continue
            estimates.sort(key=lambda row: row["minutes"])
            first = estimates[0]
            trains.append({
                "destination": entry.get("destination") or "not reported",
                "destination_abbr": entry.get("abbreviation"),
                "direction": first["direction"],
                "platform": first["platform"],
                "cars": first["cars"],
                "bikes_allowed": first["bikes_allowed"],
                "limited": str(entry.get("limited") or "0") == "1",
                "colour": first["colour"],
                "estimates": estimates,
                "minutes": first["minutes"],
                "delay_seconds": first["delay_seconds"],
                "cancelled": first["cancelled"],
            })
        trains.sort(key=lambda row: (row["minutes"] is None, row["minutes"] or 0.0))
        if not trains:
            raise BartNotFound(f"BART published no upcoming train at {station.get('name') or abbr}")
        return {
            "abbr": station.get("abbr") or abbr,
            "name": station.get("name") or _station_name(abbr),
            "feed_date": feed_date,
            "feed_time": feed_time,
            "trains": trains,
            "source": DATASET,
        }

    def station_list(self) -> list[dict]:
        """BART's 50 stations, read from the agency rather than the local table.

        The local table above is the same 50 rows and is what the ETD feed needs to
        turn a name into an abbr. This call exists so the agent can prove the two
        agree, and a disagreement is worth saying out loud.
        """
        payload = self._get("stn.aspx", {"cmd": "stns"}, ttl=86400.0)
        self._raise_on_message(payload)
        rows = (((payload.get("root") or {}).get("stations")) or {}).get("station") or []
        stations = []
        for row in rows:
            stations.append({
                "abbr": row.get("abbr"),
                "name": row.get("name"),
                "city": row.get("city"),
                "state": row.get("state"),
                "zipcode": row.get("zipcode"),
                "latitude": row.get("gtfs_latitude"),
                "longitude": row.get("gtfs_longitude"),
            })
        if not stations:
            raise BartNotFound("BART published no station list")
        return stations

    # -- shared ------------------------------------------------------------

    @staticmethod
    def _raise_on_message(payload: dict) -> None:
        """BART answers HTTP 200 with an error object in the body, not a 4xx."""
        message = ((payload.get("root") or {}).get("message") or {}).get("error")
        if not message:
            return
        text = message.get("text") or "BART refused the request"
        details = message.get("details") or ""
        suffix = f": {details}" if details else ""
        raise BartNotFound(f"{text}{suffix}")


def _station_name(abbr: str) -> str:
    for pair_abbr, name in BART_STATIONS:
        if pair_abbr == abbr:
            return name
    return abbr


def _delay(value) -> int | None:
    """BART's `delay`, which is a signed offset in seconds, not a flag.

    A positive number means the feed believes the train is running that many
    seconds behind, and 0 means on time. Reading it as a boolean would report a
    train ten minutes late as punctual.
    """
    if value is None or value == "":
        return None
    try:
        return int(round(float(value)))
    except (TypeError, ValueError):
        return None


def _cars(value) -> int | None:
    """BART's `length`, the number of cars, which is a string in the payload."""
    if value is None or value == "":
        return None
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None
