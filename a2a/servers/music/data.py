"""Read-only client for the Deezer public API.

Endpoints (keyless, verified live 2026-09-28):
  - /search?q=                      tracks, artists and albums, Deezer decides the mix
  - /search/artist?q=               the artist Deezer thinks you meant
  - /artist/{id}                    one artist's record
  - /artist/{id}/albums             an artist's releases, newest page first
  - /album/{id}                     one album, with release date, record type and runtime
  - /track/{id}                     one track, with its 30-second preview URL
  - /chart/0/tracks                 the global chart

Three things about this API shape the client:

1. Deezer rate-limits anonymous callers. There is no key to raise the limit, so the
   client reads each album's own detail page only when it needs one and never loops
   over a big list, and the cache TTLs are long because a chart or an album does not
   change by the second.
2. `/search` mixes tracks, artists and albums in one ranked list, tagged with a
   `type` field. A caller asking for artists is answered from that same list by
   filtering on `type`, which is one read rather than three.
3. A track's `preview` is a signed CDN URL with an expiry in its query string, so it
   is passed through exactly as Deezer wrote it and never rebuilt.

Errors come back as a JSON body with an `error` field rather than an HTTP status,
which the kit's `get_json` already turns into an UpstreamError.
"""

from __future__ import annotations

import re

from a2a_kit import JsonApiClient, UpstreamError, utc_now_iso

BASE_URL = "https://api.deezer.com"

SEARCH_PATH = "/search"
ARTIST_SEARCH_PATH = "/search/artist"
ARTIST_PATH = "/artist/{artist}"
ARTIST_ALBUMS_PATH = "/artist/{artist}/albums"
ALBUM_PATH = "/album/{album}"
TRACK_PATH = "/track/{track}"
CHART_PATH = "/chart/0/tracks"

DATASET = "api.deezer.com"
PRODUCT = "Deezer music catalogue: tracks, artists, albums, previews and charts"
SOURCE = "Deezer (public music catalogue API)"

TRACK_FIELDS = ("id", "title", "title_short", "title_version", "isrc", "link", "duration",
                "explicit_lyrics", "explicit_content_cover", "preview", "rank")
ALBUM_FIELDS = ("id", "title", "link", "cover_big", "nb_tracks", "duration", "record_type",
                "release_date", "explicit_lyrics")
ARTIST_FIELDS = ("id", "name", "link", "picture_big", "nb_album", "nb_fan", "type")

#: Deezer's own types. A search can return all three in one list.
ITEM_TYPES = ("track", "artist", "album")
#: What a release is, as Deezer records it. Anything else is passed through as-is.
RECORD_TYPES = ("album", "single", "ep", "compilation")

#: Deezer needs no key; it asks only that callers identify themselves politely.
_NAME_RE = re.compile(r"^.{1,120}$")
_ID_RE = re.compile(r"^\d{1,12}$")
_ISO_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

__all__ = [
    "ALBUM_FIELDS",
    "ALBUM_PATH",
    "ARTIST_ALBUMS_PATH",
    "ARTIST_FIELDS",
    "ARTIST_PATH",
    "ARTIST_SEARCH_PATH",
    "BASE_URL",
    "CHART_PATH",
    "DATASET",
    "DeezerClient",
    "ITEM_TYPES",
    "PRODUCT",
    "RECORD_TYPES",
    "SEARCH_PATH",
    "SOURCE",
    "TRACK_FIELDS",
    "TRACK_PATH",
    "UpstreamError",
    "duration_label",
]


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


def duration_label(seconds) -> str:
    """Deezer reports seconds. A caller reading a duration wants minutes and seconds."""
    total = _to_int(seconds)
    if total is None:
        return "length not reported"
    minutes, secs = divmod(max(total, 0), 60)
    return f"{minutes}:{secs:02d}" if minutes else f"{secs}s"


class DeezerClient(JsonApiClient):
    env_prefix = "DEEZER"
    base_url = BASE_URL
    #: A chart, an album and a track are all stable for minutes at a time.
    default_ttl = 900.0

    def __init__(self, fetch=None, base_url=None, cache_ttl=None, timeout=None, headers=None) -> None:
        super().__init__(fetch=fetch, base_url=base_url, cache_ttl=cache_ttl, timeout=timeout, headers=headers)
        self.catalog_ttl = float(self.cache_ttl)

    # -- validation --------------------------------------------------------

    @staticmethod
    def check_name(value) -> str:
        name = str(value).strip()
        if not _NAME_RE.match(name):
            raise ValueError("that does not look like a search term")
        return name

    @staticmethod
    def check_id(value, what: str) -> int:
        text = str(value).strip()
        if not _ID_RE.match(text):
            raise ValueError(f"a Deezer {what} id is a number, for example 399 (Radiohead)")
        return int(text)

    @staticmethod
    def check_limit(value, default: int = 10) -> int:
        limit = _to_int(value)
        if limit is None:
            limit = default
        if not 1 <= limit <= 50:
            raise ValueError("limit must be between 1 and 50")
        return limit

    @staticmethod
    def check_item_type(value, default: str = "track") -> str:
        # A caller says "albums", the feed says "album".
        kind = str(value or default).strip().lower().rstrip("s")
        if kind not in ITEM_TYPES:
            raise ValueError(f"type must be one of: {', '.join(ITEM_TYPES)}")
        return kind

    @staticmethod
    def check_release_date(value) -> str:
        day = str(value).strip()
        if not _ISO_DATE_RE.match(day):
            raise ValueError("a release date is YYYY-MM-DD, for example 2003-06-09")
        return day

    # -- reads -------------------------------------------------------------

    def search(self, query: str, limit: int = 10, item_type: str | None = None) -> list[dict]:
        """Search tracks, artists and albums in one read, or just one of them.

        Deezer returns all three kinds in one ranked list with a `type` on each row.
        Filtering locally is one read instead of three, which matters on a feed that
        rate-limits anonymous callers.
        """
        query = self.check_name(query)
        limit = self.check_limit(limit)
        kind = self.check_item_type(item_type) if item_type else None
        payload = self.get_json(SEARCH_PATH, {"q": query, "limit": max(limit, 25)}, ttl=self.catalog_ttl)
        rows = payload.get("data") if isinstance(payload, dict) else None
        if rows is None:
            raise UpstreamError("Deezer returned an unexpected search payload")
        found = []
        for row in rows:
            if not isinstance(row, dict):
                continue
            if kind is not None and str(row.get("type") or "").lower() != kind:
                continue
            found.append(self._entry(row))
            if len(found) >= limit:
                break
        return found

    def search_total(self, query: str) -> int | None:
        """How many rows Deezer says match, which is not the same as how many we list."""
        payload = self.get_json(SEARCH_PATH, {"q": self.check_name(query), "limit": 1},
                                ttl=self.catalog_ttl)
        if isinstance(payload, dict):
            return _to_int(payload.get("total"))
        return None

    def artist(self, identifier) -> dict | None:
        """One artist, by numeric id or by name. None when Deezer has no match."""
        text = str(identifier).strip()
        if not text:
            raise ValueError("give me an artist name or a Deezer artist id")
        if _ID_RE.match(text):
            payload = self.get_json(ARTIST_PATH.format(artist=text), {}, ttl=self.catalog_ttl)
            if not isinstance(payload, dict) or not payload.get("id"):
                return None
            return self.pick(payload, ARTIST_FIELDS, DATASET)
        payload = self.get_json(ARTIST_SEARCH_PATH, {"q": text, "limit": 1}, ttl=self.catalog_ttl)
        rows = payload.get("data") if isinstance(payload, dict) else None
        if not rows:
            return None
        return self.pick(rows[0], ARTIST_FIELDS, DATASET)

    def artist_albums(self, artist_id: int, limit: int = 20) -> list[dict]:
        """An artist's releases, newest page first, as Deezer pages them."""
        artist_id = self.check_id(artist_id, "artist")
        limit = self.check_limit(limit)
        payload = self.get_json(ARTIST_ALBUMS_PATH.format(artist=artist_id),
                                {"limit": min(max(limit, 25), 50)}, ttl=self.catalog_ttl)
        rows = payload.get("data") if isinstance(payload, dict) else None
        if rows is None:
            raise UpstreamError("Deezer returned an unexpected album list payload")
        albums = []
        for row in rows[:limit]:
            if not isinstance(row, dict):
                continue
            album = self.pick(row, ALBUM_FIELDS, DATASET)
            album["duration_label"] = duration_label(album.get("duration"))
            album["release_year"] = (album.get("release_date") or "")[:4] or None
            albums.append(album)
        return albums

    def album(self, album_id: int) -> dict | None:
        """One album's own record, which carries the release date Deezer omits in lists."""
        album_id = self.check_id(album_id, "album")
        payload = self.get_json(ALBUM_PATH.format(album=album_id), {}, ttl=self.catalog_ttl)
        if not isinstance(payload, dict) or not payload.get("id"):
            return None
        album = self.pick(payload, ALBUM_FIELDS, DATASET)
        album["duration_label"] = duration_label(album.get("duration"))
        album["release_year"] = (album.get("release_date") or "")[:4] or None
        artist = payload.get("artist")
        if isinstance(artist, dict):
            album["artist_name"] = artist.get("name")
            album["artist_id"] = artist.get("id")
        return album

    def track(self, track_id: int) -> dict | None:
        """One track, with the 30-second preview URL exactly as Deezer wrote it."""
        track_id = self.check_id(track_id, "track")
        payload = self.get_json(TRACK_PATH.format(track=track_id), {}, ttl=self.catalog_ttl)
        if not isinstance(payload, dict) or not payload.get("id"):
            return None
        track = self.pick(payload, TRACK_FIELDS, DATASET)
        track["duration_label"] = duration_label(track.get("duration"))
        artist = payload.get("artist")
        if isinstance(artist, dict):
            track["artist_name"] = artist.get("name")
            track["artist_id"] = artist.get("id")
        album = payload.get("album")
        if isinstance(album, dict):
            track["album_title"] = album.get("title")
            track["album_id"] = album.get("id")
        # Deezer sends an empty string rather than null for "no preview", so it is
        # normalised here: an answer must not carry "" where it means "none".
        track["preview"] = track.get("preview") or None
        track["preview_seconds"] = 30 if track.get("preview") else None
        return track

    def chart(self, limit: int = 10) -> list[dict]:
        """The global chart's top tracks."""
        limit = self.check_limit(limit)
        payload = self.get_json(CHART_PATH, {"limit": limit}, ttl=min(self.catalog_ttl, 300.0))
        rows = payload.get("data") if isinstance(payload, dict) else None
        if rows is None:
            raise UpstreamError("Deezer returned an unexpected chart payload")
        tracks = []
        for index, row in enumerate(rows[:limit], start=1):
            if not isinstance(row, dict):
                continue
            entry = self._entry(row)
            entry["position"] = index
            tracks.append(entry)
        return tracks

    @staticmethod
    def freshness() -> str:
        """Every read here is live, so freshness is the moment we read it."""
        return utc_now_iso()

    @staticmethod
    def _entry(row: dict) -> dict:
        """One search or chart row, reduced to the fields an answer actually uses."""
        kind = str(row.get("type") or "track").lower()
        if kind == "artist":
            entry = DeezerClient.pick(row, ARTIST_FIELDS, DATASET)
            entry["type"] = "artist"
            entry["artist_name"] = row.get("name")
            return entry
        if kind == "album":
            entry = DeezerClient.pick(row, ALBUM_FIELDS, DATASET)
            entry["type"] = "album"
            entry["release_year"] = (entry.get("release_date") or "")[:4] or None
            artist = row.get("artist")
            if isinstance(artist, dict):
                entry["artist_name"] = artist.get("name")
                entry["artist_id"] = artist.get("id")
            return entry
        entry = DeezerClient.pick(row, TRACK_FIELDS, DATASET)
        entry["type"] = "track"
        entry["duration_label"] = duration_label(entry.get("duration"))
        artist = row.get("artist")
        if isinstance(artist, dict):
            entry["artist_name"] = artist.get("name")
            entry["artist_id"] = artist.get("id")
        album = row.get("album")
        if isinstance(album, dict):
            entry["album_title"] = album.get("title")
            entry["album_id"] = album.get("id")
        return entry
