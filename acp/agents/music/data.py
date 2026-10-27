"""Music search, artists, albums and charts, from Deezer (keyless).

Verified live on 2026-09-28:

  https://api.deezer.com/search?q=creep
      -> track 'Creep' id 138547415, 238 s, rank 978547, 30 s preview
  https://api.deezer.com/search/artist?q=radiohead
      -> artist id 399 'Radiohead', 45 albums, 4097098 fans, ahead of a 64-fan namesake
  https://api.deezer.com/artist/27/top?limit=5
      -> 'Harder, Better, Faster, Stronger' and friends, each with rank and duration
  https://api.deezer.com/album/302127
      -> 'Discovery', released 2001-03-07, 14 tracks
  https://api.deezer.com/chart/0/tracks?limit=3
      -> the current chart, rank ~980000 for the top track

Three things the payloads make plain and this reader keeps. Deezer has **no artist-name
endpoint**: `/search/artist?q=` is the only way in, so an exact name match is preferred and a
namesake with 64 fans never wins over the artist with four million. `rank` is a popularity
score running to about a million, so it is only meaningful against another rank, never read as
"number one". And Deezer rate-limits anonymous callers hard, so every lookup is cached and
each read asks one endpoint at a time - a burst of questions reads the feed, it does not hammer
it.
"""

from __future__ import annotations

import json
import os
import re
import time
from urllib import parse, request
from urllib.error import HTTPError

API = "https://api.deezer.com"

DATASET = "Deezer (api.deezer.com)"

DEFAULT_USER_AGENT = "awesome-acps-music/1.0 (+https://github.com/mrfentmen/awesome-acps)"

#: Words that are part of asking, not part of an artist, an album or a song.
_QUESTION_WORDS = frozenset("""
a about album albums all also an and any anything are best build built by can clean could
currently did do does find for from get give has have hour hours how i in is it its just
latest like list make made me minute minutes mix music my new of on or playlist play please
queue recently recommend search set similar song songs some soundtrack study tell that the
their them there these they this to top track tracks up very want was watch were what when
where which who whom why will with would you your commute drive workout
""".split())

#: Words that introduce the thing being asked about, but only when everything before them is
#: part of the question. "songs by radiohead" splits at "by"; "back in black" does not,
#: because "back" before the "in" is the song's own word.
_SEPARATORS = frozenset({"by", "of", "on", "from", "for", "with", "in"})


def _real(word: str) -> bool:
    return (any(ch.isalnum() for ch in word) and not word.isdigit()
            and word.lower() not in _QUESTION_WORDS)


def _split_index(words: list[str]) -> int | None:
    """The first separator that has only question words before it."""
    for index, word in enumerate(words):
        if word.lower() not in _SEPARATORS:
            continue
        prefix = words[:index]
        if prefix and all(_real(word) is False for word in prefix):
            return index
    return None


def query_from_text(text: str) -> str | None:
    """The artist, album or song name pulled out of a question, or None.

    Deezer's search needs every word to match, so "find songs by Radiohead" has to arrive as
    "radiohead": one leftover word and the search returns nothing. The question frame is split
    away and the question words dropped, and a title that contains a separator word ("back in
    black") survives because the split only happens when everything before it is asking.
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
    kept: list[str] = []
    for index, word in enumerate(words):
        if _real(word):
            kept.append(word)
            continue
        if word.lower() in _QUESTION_WORDS:
            if word.lower() in _SEPARATORS and any(_real(w) for w in words[:index]) \
                    and any(_real(w) for w in words[index + 1:]):
                kept.append(word)
                continue
            if kept and kept[-1].lower() in _SEPARATORS and any(ch.isalpha() for ch in word):
                kept.append(word)
                continue
    if not kept:
        return None
    return " ".join(kept)


def is_alternate_version(title: str) -> bool:
    """A live, remix or remastered cut is not the recording someone asked for."""
    # Stems, not whole words: Deezer writes "Remastered 2011" and "Remix" and "Radio Edit",
    # and a \b straight after "remaster" would miss every one of them.
    return bool(re.search(r"\b(live|remix\w*|re-?master\w*|acoustic|instrumental|radio|"
                          r"rework\w*|demo|cover\w*|mono|stereo|\w+ edit|version)\b",
                          str(title or ""), re.IGNORECASE))


class MusicError(RuntimeError):
    """Deezer could not be read."""


class MusicNotFound(MusicError):
    """Deezer answered 404, or matched nothing - a real 'nothing here', not a failure."""


def _minutes(seconds) -> str:
    try:
        total = int(seconds)
    except (TypeError, ValueError):
        return "not reported"
    return f"{total // 60}:{total % 60:02d}"


class MusicData:
    """Deezer: search, one artist's catalogue, one album's tracks, the chart."""

    def __init__(self, fetch=None, cache_ttl: float = 3600.0, timeout: float = 25.0,
                 user_agent: str | None = None) -> None:
        self.cache_ttl = float(os.environ.get("MUSIC_CACHE_TTL", cache_ttl))
        self.timeout = float(os.environ.get("MUSIC_HTTP_TIMEOUT", timeout))
        self.user_agent = (user_agent or os.environ.get("MUSIC_USER_AGENT")
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
            raise MusicNotFound(f"request failed: {exc}") from exc
        except Exception as exc:  # urllib raises many other types too
            raise MusicError(f"request failed: {exc}") from exc

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
                raise MusicError(f"Deezer returned something that is not JSON: {exc}") from exc
        self._cache[url] = (now + (ttl if ttl is not None else self.cache_ttl), payload)
        return payload

    # -- cleaning ----------------------------------------------------------

    @staticmethod
    def _clean_track(row: dict) -> dict:
        return {
            "id": row.get("id"),
            "title": row.get("title") or "not reported",
            "title_short": row.get("title_short") or row.get("title"),
            "artist": (row.get("artist") or {}).get("name"),
            "artist_id": (row.get("artist") or {}).get("id"),
            "album": (row.get("album") or {}).get("title"),
            "album_id": (row.get("album") or {}).get("id"),
            "duration": row.get("duration"),
            "length": _minutes(row.get("duration")),
            "rank": row.get("rank"),
            "explicit": row.get("explicit_lyrics") is True,
            "preview": row.get("preview") or None,
            "link": row.get("link"),
        }

    @staticmethod
    def _clean_artist(row: dict) -> dict:
        return {
            "id": row.get("id"),
            "name": row.get("name") or "not reported",
            "albums": row.get("nb_album"),
            "fans": row.get("nb_fan"),
            "picture": row.get("picture_medium") or row.get("picture_big") or None,
            "link": row.get("link"),
        }

    @staticmethod
    def _clean_album(row: dict) -> dict:
        return {
            "id": row.get("id"),
            "title": row.get("title") or "not reported",
            "artist": (row.get("artist") or {}).get("name"),
            "released": row.get("release_date") or None,
            "fans": row.get("fans"),
            "cover": row.get("cover_medium") or row.get("cover_big") or None,
            "link": row.get("link"),
        }

    # -- reads -------------------------------------------------------------

    def search(self, query: str, limit: int = 10) -> list[dict]:
        """Tracks matching a query, best match first."""
        text = str(query or "").strip()
        if not text:
            raise ValueError("tell me what to search for, for example Creep")
        wanted = max(1, min(int(limit), 40))
        payload = self._get(f"{API}/search?q={parse.quote(text)}&limit={wanted}", ttl=900.0)
        rows = payload.get("data") if isinstance(payload, dict) else None
        if not isinstance(rows, list):
            raise MusicError("Deezer returned an unexpected search payload")
        tracks = [self._clean_track(row) for row in rows if isinstance(row, dict)]
        if not tracks:
            raise MusicNotFound(f"Deezer has no track matching {text!r}")
        return tracks

    def artist(self, name: str) -> dict:
        """One artist, matched on the exact name where Deezer has it."""
        text = str(name or "").strip()
        if not text:
            raise ValueError("tell me which artist, for example Radiohead")
        payload = self._get(f"{API}/search/artist?q={parse.quote(text)}&limit=25")
        rows = payload.get("data") if isinstance(payload, dict) else None
        if not isinstance(rows, list) or not rows:
            raise MusicNotFound(f"Deezer has no artist called {text!r}")
        artists = [self._clean_artist(row) for row in rows if isinstance(row, dict)]
        lowered = text.lower()
        for row in artists:
            if row["name"].lower() == lowered:
                return row
        #: No exact name: the most-followed match is the artist's, not a namesake's.
        return max(artists, key=lambda row: row["fans"] or 0)

    def top_tracks(self, artist_id, limit: int = 20) -> list[dict]:
        """An artist's most played tracks, Deezer's own order."""
        rows = self._get(f"{API}/artist/{int(artist_id)}/top?limit={max(1, min(int(limit), 100))}")
        data = rows.get("data") if isinstance(rows, dict) else None
        if not isinstance(data, list) or not data:
            raise MusicNotFound(f"Deezer publishes no top tracks for artist {artist_id}")
        return [self._clean_track(row) for row in data if isinstance(row, dict)]

    def albums(self, artist_id, limit: int = 25) -> list[dict]:
        """An artist's albums, most recent first as Deezer orders them."""
        rows = self._get(f"{API}/artist/{int(artist_id)}/albums?limit={max(1, min(int(limit), 100))}")
        data = rows.get("data") if isinstance(rows, dict) else None
        if not isinstance(data, list) or not data:
            raise MusicNotFound(f"Deezer lists no albums for artist {artist_id}")
        return [self._clean_album(row) for row in data if isinstance(row, dict)]

    def album(self, query: str) -> dict:
        """One album: the most-followed match, because a title is not a unique name.

        Deezer's album search is fuzzy, and titles repeat - searching "kid" returns an album
        called "Kid" by Eddy de Pretto ahead of Radiohead's "Kid A". An exact-title match is
        not a safe tie-break either, because the words the reader typed are often a prefix
        ("what is on Kid A?" strips the trailing article), so the most-followed match wins and
        the title is printed exactly as Deezer spells it.
        """
        text = str(query or "").strip()
        if not text:
            raise ValueError("tell me which album, for example Kid A")
        payload = self._get(f"{API}/search/album?q={parse.quote(text)}&limit=25")
        rows = payload.get("data") if isinstance(payload, dict) else None
        if not isinstance(rows, list) or not rows:
            raise MusicNotFound(f"Deezer has no album called {text!r}")
        albums = [self._clean_album(row) for row in rows if isinstance(row, dict)]
        chosen = max(albums, key=lambda row: row["fans"] or 0)
        detail = self._get(f"{API}/album/{int(chosen['id'])}")
        if not isinstance(detail, dict) or not detail.get("id"):
            raise MusicNotFound(f"Deezer has no track listing for album {text!r}")
        tracks = ((detail.get("tracks") or {}).get("data")) or []
        album = self._clean_album(detail)
        album["track_count"] = detail.get("nb_tracks")
        album["explicit"] = detail.get("explicit_lyrics") is True
        album["tracks"] = [self._clean_track(row) for row in tracks if isinstance(row, dict)]
        if not album["tracks"]:
            raise MusicNotFound(f"Deezer lists no tracks for album {text!r}")
        return album

    def chart(self, limit: int = 20) -> list[dict]:
        """Deezer's own chart, in Deezer's order."""
        rows = self._get(f"{API}/chart/0/tracks?limit={max(1, min(int(limit), 100))}", ttl=600.0)
        data = rows.get("data") if isinstance(rows, dict) else None
        if not isinstance(data, list) or not data:
            raise MusicNotFound("Deezer published an empty chart")
        return [self._clean_track(row) for row in data if isinstance(row, dict)]
