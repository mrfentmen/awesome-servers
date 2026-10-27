"""Read-only client for TVMaze, the open TV schedule database.

Endpoints (keyless, verified live 2026-09-28):
  - /search/shows?q=                 shows matching a word, with TVMaze's own score
  - /singlesearch/shows?q=           the one show TVMaze thinks you meant
  - /shows/{id}                      one show's record
  - /shows/{id}/episodes             every episode, oldest first, with its airdate
  - /schedule?date=YYYY-MM-DD        everything airing on one day, optionally per country

Three things about this API shape the client:

1. There is no key, no quota and no sign-up. A plain User-Agent is all it asks for.
2. `summary` arrives as an HTML fragment, so it is turned into plain text here once
   rather than in every skill that reads it.
3. An episode's `airstamp` is UTC with an offset and may be null for an episode that
   has no confirmed slot yet, so "next" is worked out from airstamps and never from
   the order the rows happen to come back in.

An unmatched search is a normal answer, not an error: `singlesearch` answers HTTP 404
for a name TVMaze does not know, and that becomes "no show matches" rather than a
crash.
"""

from __future__ import annotations

import os
import re
from datetime import date as date_cls
from datetime import datetime, timedelta, timezone
from html import unescape

from a2a_kit import JsonApiClient, UpstreamError, utc_now_iso

BASE_URL = "https://api.tvmaze.com"

SEARCH_PATH = "/search/shows"
SINGLESEARCH_PATH = "/singlesearch/shows"
SHOW_PATH = "/shows/{show}"
EPISODES_PATH = "/shows/{show}/episodes"
SCHEDULE_PATH = "/schedule"

DATASET = "api.tvmaze.com"
PRODUCT = "TVMaze show, episode and daily schedule data"
SOURCE = "TVMaze (open television schedule data)"

SHOW_FIELDS = ("id", "name", "type", "language", "status", "premiered", "ended",
               "averageRuntime", "genres", "network", "webChannel", "schedule", "rating",
               "officialSite", "externals")
EPISODE_FIELDS = ("id", "name", "season", "number", "type", "airdate", "airtime",
                  "airstamp", "runtime", "rating")

#: TVMaze statuses worth distinguishing in an answer.
STATUSES = ("Running", "Ended", "In Production", "Planned", "Canceled")

_NAME_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9 .,'’:\-!?&()]{1,80}$")
_SHOW_ID_RE = re.compile(r"^\d{1,8}$")
_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
_COUNTRY_RE = re.compile(r"^[A-Za-z]{2}$")
DAY_NAMES = ("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday")

__all__ = [
    "BASE_URL",
    "DATASET",
    "DAY_NAMES",
    "EPISODES_PATH",
    "EPISODE_FIELDS",
    "PRODUCT",
    "SCHEDULE_PATH",
    "SEARCH_PATH",
    "SHOW_FIELDS",
    "SHOW_PATH",
    "SINGLESEARCH_PATH",
    "SOURCE",
    "STATUSES",
    "TvmazeClient",
    "UpstreamError",
    "day_for_name",
    "plain_text",
]

def plain_text(html) -> str | None:
    """TVMaze's `summary` is an HTML fragment; a message has to be readable."""
    if not isinstance(html, str):
        return None
    text = unescape(re.sub(r"<[^>]*>", " ", html))
    text = re.sub(r"\s+", " ", text).strip()
    return text or None


def day_for_name(name: str) -> str | None:
    """Monday..Sunday -> the ISO date it means relative to today (next occurrence)."""
    needle = str(name or "").strip().lower()
    if needle not in DAY_NAMES:
        return None
    today = datetime.now(timezone.utc).date()
    ahead = (DAY_NAMES.index(needle) - today.weekday()) % 7
    return (today + timedelta(days=ahead)).isoformat()


def _to_float(value) -> float | None:
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _to_int(value) -> int | None:
    number = _to_float(value)
    return None if number is None else int(number)


def _station_label(row: dict) -> str | None:
    network = row.get("network") or row.get("webChannel") or None
    if not isinstance(network, dict):
        return None
    return network.get("name") or None


class TvmazeClient(JsonApiClient):
    env_prefix = "TVMAZE"
    base_url = BASE_URL
    #: The daily schedule is the only read that moves during a day.
    schedule_ttl_default = 300.0

    def __init__(self, fetch=None, base_url=None, cache_ttl=None, timeout=None, headers=None) -> None:
        super().__init__(fetch=fetch, base_url=base_url, cache_ttl=cache_ttl, timeout=timeout, headers=headers)
        self.schedule_ttl = float(os.environ.get(f"{self.env_prefix}_SCHEDULE_TTL", str(self.schedule_ttl_default)))

    # -- validation --------------------------------------------------------

    @staticmethod
    def check_show_id(value) -> int:
        show_id = str(value).strip()
        if not _SHOW_ID_RE.match(show_id):
            raise ValueError("a TVMaze show id is a number, for example 44933 (Severance)")
        return int(show_id)

    @staticmethod
    def check_name(value) -> str:
        name = str(value).strip()
        if not _NAME_RE.match(name):
            raise ValueError("that does not look like a show name")
        return name

    @staticmethod
    def check_limit(value, default: int = 10) -> int:
        try:
            limit = int(value)
        except (TypeError, ValueError):
            raise ValueError("limit must be a whole number") from None
        if not 1 <= limit <= 50:
            raise ValueError("limit must be between 1 and 50")
        return limit

    @staticmethod
    def check_date(value) -> str:
        day = str(value).strip()
        if not _DATE_RE.match(day):
            raise ValueError("a date is YYYY-MM-DD, for example 2026-09-28")
        try:
            date_cls.fromisoformat(day)
        except ValueError:
            raise ValueError("that date does not exist, use YYYY-MM-DD") from None
        return day

    @staticmethod
    def check_country(value) -> str:
        code = str(value).strip().upper()
        if not _COUNTRY_RE.match(code):
            raise ValueError("a country is a two-letter code, for example US or GB")
        return code

    @staticmethod
    def check_season(value) -> int:
        season = _to_int(value)
        if season is None or season < 1:
            raise ValueError("a season is a whole number of 1 or more")
        if season > 100:
            raise ValueError("a season must be 100 or less")
        return season

    @staticmethod
    def check_episode(value) -> int:
        episode = _to_int(value)
        if episode is None or episode < 0:
            raise ValueError("an episode number is a whole number of 0 or more")
        if episode > 1000:
            raise ValueError("an episode number must be 1000 or less")
        return episode

    # -- reads -------------------------------------------------------------

    def search_shows(self, query: str, limit: int = 10) -> list[dict]:
        """Shows matching a word, best score first. An empty list is a valid answer."""
        query = self.check_name(query)
        limit = self.check_limit(limit)
        payload = self.get_json(SEARCH_PATH, {"q": query}, ttl=600.0)
        rows = payload if isinstance(payload, list) else []
        found = []
        for row in rows[:limit]:
            show = row.get("show") if isinstance(row, dict) else None
            if not isinstance(show, dict):
                continue
            entry = self.pick(show, SHOW_FIELDS, DATASET)
            entry["match_score"] = _to_float(row.get("score"))
            entry["station"] = _station_label(show)
            entry["summary"] = plain_text(show.get("summary"))
            found.append(entry)
        return found

    def show(self, identifier) -> dict | None:
        """One show, by numeric id or by name. None when TVMaze has no match."""
        text = str(identifier).strip()
        if not text:
            raise ValueError("give me a show name or a TVMaze show id")
        if _SHOW_ID_RE.match(text):
            payload = self.get_json(SHOW_PATH.format(show=text), {}, ttl=3600.0)
            if not isinstance(payload, dict) or not payload.get("id"):
                return None
            return self._show_entry(payload)
        # singlesearch answers 404 for a name it does not know; get_json turns that
        # into an UpstreamError, which the agent reads as "no such show".
        payload = self.get_json(SINGLESEARCH_PATH, {"q": text}, ttl=600.0)
        if not isinstance(payload, dict) or not payload.get("id"):
            return None
        return self._show_entry(payload)

    def episodes(self, show_id: int) -> list[dict]:
        """Every episode of a show, oldest first. A show with none returns []."""
        show_id = self.check_show_id(show_id)
        payload = self.get_json(EPISODES_PATH.format(show=show_id), {}, ttl=3600.0)
        rows = payload if isinstance(payload, list) else []
        episodes = []
        for row in rows:
            if not isinstance(row, dict):
                continue
            entry = self.pick(row, EPISODE_FIELDS, DATASET)
            entry["summary"] = plain_text(row.get("summary"))
            entry["label"] = self.episode_label(entry.get("season"), entry.get("number"))
            episodes.append(entry)
        episodes.sort(key=lambda ep: (ep.get("season") or 0, ep.get("number") or 0))
        return episodes

    def schedule(self, day: str | None = None, country: str | None = None,
                 limit: int = 25) -> list[dict]:
        """Everything airing on one day. `day` defaults to today in UTC."""
        day = self.check_date(day) if day else datetime.now(timezone.utc).date().isoformat()
        params = {"date": day}
        if country:
            params["country"] = self.check_country(country)
        payload = self.get_json(SCHEDULE_PATH, params, ttl=self.schedule_ttl)
        rows = payload if isinstance(payload, list) else []
        limit = self.check_limit(limit, default=25)
        entries = []
        for row in rows[:limit]:
            if not isinstance(row, dict):
                continue
            show = row.get("show") if isinstance(row.get("show"), dict) else {}
            entry = self.pick(row, EPISODE_FIELDS, DATASET)
            entry["show_id"] = show.get("id")
            entry["show_name"] = show.get("name")
            entry["show_type"] = show.get("type")
            entry["station"] = _station_label(show)
            entry["label"] = self.episode_label(entry.get("season"), entry.get("number"))
            entry["summary"] = plain_text(row.get("summary"))
            entries.append(entry)
        return entries

    def next_episode(self, show_id: int) -> dict | None:
        """The first episode whose airstamp is still in the future, or None."""
        now = datetime.now(timezone.utc)
        for episode in self.episodes(show_id):
            stamp = episode.get("airstamp")
            if not stamp:
                continue
            try:
                when = datetime.fromisoformat(str(stamp))
            except ValueError:
                continue
            if when > now:
                return episode
        return None

    @staticmethod
    def episode_label(season, number) -> str:
        season_text = _to_int(season)
        number_text = _to_int(number)
        if season_text is None and number_text is None:
            return "episode not numbered"
        if season_text is None:
            return f"episode {number_text}"
        if number_text is None:
            return f"season {season_text}"
        return f"S{season_text:02d}E{number_text:02d}"

    @staticmethod
    def place_label(show: dict | None) -> str:
        show = show or {}
        name = show.get("name") or "that show"
        station = show.get("station")
        show_id = show.get("id")
        return f"{name} ({station})" if station else (f"{name} (show {show_id})" if show_id else name)

    def _show_entry(self, show: dict) -> dict:
        entry = self.pick(show, SHOW_FIELDS, DATASET)
        entry["station"] = _station_label(show)
        entry["summary"] = plain_text(show.get("summary"))
        schedule = show.get("schedule") if isinstance(show.get("schedule"), dict) else {}
        days = schedule.get("days") if isinstance(schedule.get("days"), list) else []
        entry["schedule_days"] = ", ".join(days) or None
        entry["schedule_time"] = schedule.get("time") or None
        rating = show.get("rating") if isinstance(show.get("rating"), dict) else {}
        entry["rating"] = _to_float(rating.get("average"))
        return entry

    @staticmethod
    def freshness() -> str:
        """Every read here is live, so freshness is the moment we read it."""
        return utc_now_iso()
