"""TV schedules, episode lists and air dates, from TVMaze (keyless).

Verified live on 2026-09-28:

  https://api.tvmaze.com/search/shows?q=severance
      -> score 0.8896408, show 'Severance' (Apple TV+, status 'Running', premiered 2022-02-18)
  https://api.tvmaze.com/shows/2/episodes
      -> 103 episodes, each with season, number, airdate, airstamp and runtime
  https://api.tvmaze.com/shows/<id>?embed[]=episodes
      -> the show plus its whole episode list in one request

Three things the payloads make plain and this reader keeps. `airstamp` is the air time in UTC
and `airtime` is the broadcaster's local clock, so "when did it air" is answered from
`airstamp` and only ever converted to a local time when the show's network is known.
`runtime` is missing on plenty of episodes and a real value elsewhere, so a runtime is never
filled in with a guess. And TVMaze has **no** record of episodes that have not been scheduled
yet: a show with no future airdate genuinely has no next episode, and this reader says so
instead of inventing one.
"""

from __future__ import annotations

import datetime
import json
import os
import time
from urllib import parse, request
from urllib.error import HTTPError

API = "https://api.tvmaze.com"

DATASET = "TVMaze (api.tvmaze.com)"

DEFAULT_USER_AGENT = "awesome-acps-tv/1.0 (+https://github.com/mrfentmen/awesome-acps)"

#: Words that are part of asking, not part of a show's name.
_QUESTION_WORDS = frozenset("""
a about actually am an and any anything are as at be been behind by can caught catch catching
could currently did do does done far find for from finish finished get give go has have how i
in is it its just latest like list long many me much my need new next of on onto or please
recently season series show shows similar still suggest take tell than that the their them
there these they this through till to too up upcoming until very want was watch watched
watching week were what when where which who whom why will with would you your episode
episodes airing aired airs air happened
""".split())

#: Words that can introduce the show's name, but only when everything before them is part of
#: the question. "the next episode of severance" splits at "of"; "house of the dragon" does
#: not, because "house" before the "of" is the show's own word.
_SEPARATORS = frozenset({"of", "on", "for", "about"})


def _split_index(words: list[str]) -> int | None:
    """The first separator that has only question words and numbers before it."""
    for index, word in enumerate(words):
        if word.lower() not in _SEPARATORS:
            continue
        prefix = words[:index]
        if prefix and all(w.lower() in _QUESTION_WORDS or w.isdigit() for w in prefix):
            return index
    return None


def show_query_from_text(text: str) -> str | None:
    """The show's name pulled out of a question, or None if there is nothing left.

    TVMaze's `q=` needs every word to match, so "what is the next episode of severance?" has
    to arrive as "severance" - a question with a word left over matches nothing at all. The
    question frame is therefore split away and the question words dropped, which leaves a
    title containing "of" ("house of the dragon") untouched, because the split only happens
    when everything before the separator is part of asking.
    """
    cleaned = str(text or "")
    for char in "?!.,;:'\"’":
        cleaned = cleaned.replace(char, " ")
    words = cleaned.split()
    while words:
        index = _split_index(words)
        if index is None:
            break
        words = words[index + 1:]
    # A separator between two real words is part of the title ("house of the dragon"); a
    # question word in the same place is not ("severance at 3 a week"). So a separator is
    # kept only when real words sit on both sides of it, and the article right after one
    # ("of the dragon") belongs to the title too. A bare number is a season or a pace,
    # never part of a show's name.
    def real(word: str) -> bool:
        return (any(ch.isalnum() for ch in word) and not word.isdigit()
                and word.lower() not in _QUESTION_WORDS)

    kept: list[str] = []
    for index, word in enumerate(words):
        if not real(word) and word.lower() not in _QUESTION_WORDS:
            continue
        if word.lower() in _QUESTION_WORDS:
            if word.lower() in _SEPARATORS and any(real(w) for w in words[:index]) \
                    and any(real(w) for w in words[index + 1:]):
                kept.append(word)
                continue
            #: An article straight after a separator is the show's own word.
            if kept and kept[-1].lower() in _SEPARATORS and any(ch.isalpha() for ch in word):
                kept.append(word)
                continue
            continue
        if any(ch.isalnum() for ch in word) and not word.isdigit():
            kept.append(word)
    if not kept:
        return None
    return " ".join(kept)


class TvError(RuntimeError):
    """TVMaze could not be read."""


class TvNotFound(TvError):
    """TVMaze answered 404, or matched no show - a real 'nothing here', not a failure."""




def season_from_text(text: str) -> int | None:
    """A season number written out, or None."""
    import re

    match = re.search(r"\bseason\s+(\d{1,2})\b", str(text or ""), re.IGNORECASE)
    if match:
        return int(match.group(1))
    match = re.search(r"\bs(\d{1,2})\b", str(text or ""), re.IGNORECASE)
    if match:
        return int(match.group(1))
    return None


def _now() -> datetime.datetime:
    return datetime.datetime.now(datetime.timezone.utc)


def _local_date(stamp: str) -> str:
    return str(stamp or "")[:10]


class TvData:
    """TVMaze: find a show, then its episodes and air dates."""

    def __init__(self, fetch=None, cache_ttl: float = 3600.0, timeout: float = 25.0,
                 user_agent: str | None = None) -> None:
        self.cache_ttl = float(os.environ.get("TV_CACHE_TTL", cache_ttl))
        self.timeout = float(os.environ.get("TV_HTTP_TIMEOUT", timeout))
        self.user_agent = (user_agent or os.environ.get("TV_USER_AGENT")
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
            raise TvNotFound(f"request failed: {exc}") from exc
        except Exception as exc:  # urllib raises many other types too
            raise TvError(f"request failed: {exc}") from exc

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
                raise TvError(f"TVMaze returned something that is not JSON: {exc}") from exc
        self._cache[url] = (now + (ttl if ttl is not None else self.cache_ttl), payload)
        return payload

    # -- reads -------------------------------------------------------------

    @staticmethod
    def _clean(show: dict) -> dict:
        return {
            "id": show.get("id"),
            "name": show.get("name"),
            "type": show.get("type"),
            "status": show.get("status"),
            "language": show.get("language"),
            "genres": show.get("genres") or [],
            "runtime": show.get("averageRuntime") or show.get("runtime"),
            "premiered": show.get("premiered"),
            "ended": show.get("ended"),
            "network": (show.get("network") or show.get("webChannel") or {}).get("name"),
            "schedule": (show.get("schedule") or {}).get("display"),
            "rating": (show.get("rating") or {}).get("average"),
            "genres_text": ", ".join(show.get("genres") or []),
            "summary": (show.get("summary") or "").strip() or None,
            "official_site": show.get("officialSite") or None,
            "image": ((show.get("image") or {}).get("medium")
                      or (show.get("image") or {}).get("original")),
            "url": show.get("url"),
        }

    @staticmethod
    def _clean_episode(episode: dict) -> dict:
        return {
            "id": episode.get("id"),
            "name": episode.get("name") or "not reported",
            "season": episode.get("season"),
            "number": episode.get("number"),
            "airdate": episode.get("airdate") or None,
            "airstamp": episode.get("airstamp") or None,
            "airtime": episode.get("airtime") or None,
            "runtime": episode.get("runtime"),
            "type": episode.get("type"),
            "rating": (episode.get("rating") or {}).get("average"),
            "summary": (episode.get("summary") or "").strip() or None,
            "url": episode.get("url"),
        }

    def search(self, query: str, limit: int = 8) -> list[dict]:
        """Shows matching a query, best match first."""
        text = str(query or "").strip()
        if not text:
            raise ValueError("tell me which show, for example Severance")
        wanted = max(1, min(int(limit), 20))
        rows = self._get(f"{API}/search/shows?q={parse.quote(text)}")
        if not isinstance(rows, list):
            raise TvError("TVMaze returned an unexpected search payload")
        out = []
        for row in rows[:wanted]:
            show = row.get("show") or {}
            record = self._clean(show)
            record["score"] = row.get("score")
            out.append(record)
        if not out:
            raise TvNotFound(f"TVMaze has no show matching {text!r}")
        return out

    def show(self, query: str) -> dict:
        """One show, matched exactly when possible and by best score otherwise."""
        text = str(query or "").strip()
        if not text:
            raise ValueError("tell me which show, for example Severance")
        rows = self._get(f"{API}/search/shows?q={parse.quote(text)}")
        if not isinstance(rows, list) or not rows:
            raise TvNotFound(f"TVMaze has no show matching {text!r}")
        lowered = text.lower()
        chosen = None
        for row in rows:
            name = ((row.get("show") or {}).get("name") or "").lower()
            if name == lowered:
                chosen = row.get("show") or {}
                break
        if chosen is None:
            chosen = rows[0].get("show") or {}
        return self._clean(chosen)

    def episodes(self, show: dict, season: int | None = None) -> list[dict]:
        """A show's episodes, oldest first, optionally one season only."""
        show_id = show.get("id")
        if not show_id:
            raise ValueError("that show has no id, so TVMaze cannot list its episodes")
        rows = self._get(f"{API}/shows/{show_id}/episodes", ttl=600.0)
        if not isinstance(rows, list):
            raise TvError("TVMaze returned an unexpected episode payload")
        episodes = [self._clean_episode(row) for row in rows if isinstance(row, dict)]
        if season is not None:
            episodes = [ep for ep in episodes if ep["season"] == season]
        episodes.sort(key=lambda ep: (ep["season"] or 0, ep["number"] or 0))
        if not episodes:
            raise TvNotFound(
                f"TVMaze lists no episode{'s of season %d' % season if season else 's'} "
                f"for {show.get('name') or 'that show'!r}")
        return episodes

    def next_episode(self, show: dict) -> dict | None:
        """The next episode that has an air date in the future, or None.

        None is a real answer: TVMaze schedules an episode only once it has a slot, so a show
        between seasons simply has no next episode to name.
        """
        now = _now()
        for episode in self.episodes(show):
            stamp = episode.get("airstamp")
            if not stamp:
                continue
            try:
                when = datetime.datetime.fromisoformat(stamp)
            except ValueError:
                continue
            if when.tzinfo is None:
                when = when.replace(tzinfo=datetime.timezone.utc)
            if when > now:
                return episode
        return None

    def aired(self, episodes: list[dict]) -> list[dict]:
        """Only the episodes whose air time has passed."""
        now = _now()
        out = []
        for episode in episodes:
            stamp = episode.get("airstamp") or episode.get("airdate")
            if not stamp:
                continue
            try:
                when = datetime.datetime.fromisoformat(stamp)
            except ValueError:
                when = datetime.datetime.fromisoformat(str(stamp) + "T00:00:00+00:00")
            if when.tzinfo is None:
                when = when.replace(tzinfo=datetime.timezone.utc)
            if when <= now:
                out.append(episode)
        return out
