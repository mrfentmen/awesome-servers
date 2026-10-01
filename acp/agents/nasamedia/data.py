"""NASA's image and video library, keyless, from images-api.nasa.gov.

Verified live on 2026-09-28:

  .../search?q=apollo+11&media_type=image
      -> HTTP 200, collection.metadata.total_hits 1522, 100 items on page 1
      -> items[0].data[0]: nasa_id 'jsc2007e034221', title 'Apollo 11 spacecraft
         pre-launch', date_created 1969-07-11, center 'JSC', album
         ['KSC_50th_Anniversary'], media_type 'image'
      -> items[0].href is the item's own collection.json, items[0].links carries
         the direct asset hrefs with width/height/size
  .../asset/jsc2007e034221
      -> HTTP 200, 6 hrefs: ~orig ~large ~medium ~small ~thumb jpg + metadata.json

Three things the payloads make plain and this reader keeps. **A search page is 100
items, never the whole hit count**: 'apollo 11' alone says 1522 hits, so any claim
about the shape of a collection has to say which page it read. And there is **no way
to ask this API for a collection by id** - `?collection_id=...` is refused with HTTP
400 `{"reason":"Unacceptable search parameter: collection_id"}` and the catalogue
endpoint `collection.json` is a plain HTTP 404, so a collection is only reachable
through the `album` list on the items a keyword search happens to return. Finally the
`album` list is what a collection *is* here, and an item can sit in several at once,
so counting items per album is not the same as counting the collection.
"""

from __future__ import annotations

import json
import os
import time
from urllib import parse, request
from urllib.error import HTTPError

SEARCH_URL = "https://images-api.nasa.gov/search"
ASSET_URL = "https://images-api.nasa.gov/asset"

DATASET = "NASA Image and Video Library (images-api.nasa.gov)"

DEFAULT_USER_AGENT = "awesome-acps-nasamedia/1.0 (+https://github.com/mrfentmen/awesome-acps)"

#: The media types this library holds. `media_type` is a filter, not a guess: an
#: unfiltered search returns all three, which is why every skill states the one it used.
MEDIA_TYPES = ("image", "video", "audio")

#: One search page. The API does not return more than this, whatever you ask for.
PAGE_SIZE = 100


class NasaMediaError(RuntimeError):
    """The NASA image library could not be read."""


class NasaMediaNotFound(NasaMediaError):
    """The library answered, and it has nothing - a real 'no results', not a failure."""


def normalise_media_type(value: str | None) -> str | None:
    """A media type this library actually has, or None for 'everything'."""
    if value is None or value == "":
        return None
    text = str(value).strip().lower()
    if text in ("all", "any", "both"):
        return None
    if text == "pictures":
        return "image"
    if text in ("videos", "movies"):
        return "video"
    if text in ("sounds", "sound"):
        return "audio"
    if text not in MEDIA_TYPES:
        raise ValueError(f"NASA's library holds {'/'.join(MEDIA_TYPES)} media, not {text!r}")
    return text


def decade_of(date_created: str | None) -> int | None:
    """The 1960s-style decade of an ISO date, or None when there is no year."""
    text = str(date_created or "")
    if len(text) < 4 or not text[:4].isdigit():
        return None
    return (int(text[:4]) // 10) * 10


class NasaMediaData:
    """Keyword search over NASA's image, video and audio library."""

    def __init__(self, fetch=None, cache_ttl: float = 1800.0, timeout: float = 40.0,
                 user_agent: str | None = None) -> None:
        self.cache_ttl = float(os.environ.get("NASAMEDIA_CACHE_TTL", cache_ttl))
        self.timeout = float(os.environ.get("NASAMEDIA_HTTP_TIMEOUT", timeout))
        self.user_agent = (user_agent or os.environ.get("NASAMEDIA_USER_AGENT")
                           or DEFAULT_USER_AGENT)
        self._fetch = fetch or self._http_json
        self._cache: dict[str, tuple[float, object]] = {}

    # -- transport ---------------------------------------------------------

    def _http_json(self, url: str, params: dict | None = None) -> str:
        query = f"{url}?{parse.urlencode(params, doseq=True)}" if params else url
        req = request.Request(query, headers={"User-Agent": self.user_agent, "Accept": "*/*"})
        try:
            with request.urlopen(req, timeout=self.timeout) as resp:
                return resp.read().decode("utf-8", "replace")
        except HTTPError as exc:
            raise NasaMediaNotFound(f"request failed: {exc}") from exc
        except Exception as exc:  # urllib raises many other types too
            raise NasaMediaError(f"request failed: {exc}") from exc

    def _load(self, url: str, params: dict, ttl: float) -> dict:
        key = f"{url}?{parse.urlencode(params, doseq=True)}"
        now = time.time()
        hit = self._cache.get(key)
        if hit and hit[0] > now:
            return hit[1]
        payload = self._fetch(url, params)
        if isinstance(payload, (str, bytes)):
            try:
                payload = json.loads(payload)
            except ValueError as exc:
                raise NasaMediaError(
                    f"the NASA library returned something that is not JSON: {exc}") from exc
        if not isinstance(payload, dict):
            raise NasaMediaError("the NASA library returned an unexpected payload")
        self._cache[key] = (now + ttl, payload)
        return payload

    # -- reads -------------------------------------------------------------

    def search(self, query: str, media_type: str | None = None, page: int = 1,
               year_start: int | None = None, year_end: int | None = None,
               ttl: float | None = None) -> dict:
        """One page of keyword results, newest fields kept as plain values."""
        text = str(query or "").strip()
        if not text:
            raise ValueError("tell me what to search for, for example apollo 11")
        wanted_media = normalise_media_type(media_type)
        number = max(1, min(int(page), 20))
        params: dict = {"q": text}
        if wanted_media:
            params["media_type"] = wanted_media
        if year_start:
            params["year_start"] = int(year_start)
        if year_end:
            params["year_end"] = int(year_end)
        if number > 1:
            params["page"] = number

        payload = self._load(SEARCH_URL, params,
                             self.cache_ttl if ttl is None else ttl)
        collection = payload.get("collection") or {}
        metadata = collection.get("metadata") or {}
        rows = []
        for entry in collection.get("items") or []:
            record = self._entry(entry)
            if record:
                rows.append(record)
        if not rows:
            where = f" as {wanted_media}" if wanted_media else ""
            raise NasaMediaNotFound(
                f"NASA's library has nothing{where} for {text!r} on page {number}"
                + (f" (year filter {year_start}-{year_end})" if year_start or year_end else ""))

        try:
            total_hits = int(metadata.get("total_hits"))
        except (TypeError, ValueError):
            total_hits = None
        return {"query": text, "media_type": wanted_media, "page": number,
                "total_hits": total_hits, "items": rows, "returned": len(rows),
                "page_size": PAGE_SIZE,
                "more_pages": bool(total_hits and number * PAGE_SIZE < total_hits),
                "source": DATASET}

    def entry(self, nasa_id: str) -> dict:
        """One item by its nasa_id, with every media file it owns."""
        ident = str(nasa_id or "").strip()
        if not ident:
            raise ValueError("tell me which item, for example jsc2007e034221")
        payload = self._load(f"{ASSET_URL}/{parse.quote(ident)}", {}, 3600.0)
        entries = ((payload.get("collection") or {}).get("items")) or []
        if not entries:
            raise NasaMediaNotFound(f"NASA's library has no media files for {ident!r}")
        files = []
        for row in entries:
            href = row.get("href")
            if href:
                files.append({"href": str(href), "kind": str(href).rsplit(".", 1)[-1].lower()})
        # The item's own search record carries the human fields; assets do not.
        record = self.search(ident, page=1, ttl=0.0)
        for row in record["items"]:
            if row["nasa_id"] == ident:
                row["files"] = files
                return row
        fallback = {"nasa_id": ident, "title": ident, "date_created": None, "center": None,
                    "keywords": [], "album": [], "description": None,
                    "media_type": files[0]["kind"] if files else None,
                    "assets": [], "collection_url": f"{ASSET_URL}/{parse.quote(ident)}",
                    "decade": None}
        fallback["files"] = files
        return fallback

    # -- shaping -----------------------------------------------------------

    @staticmethod
    def _entry(entry: dict) -> dict | None:
        """One search item, flattened. The `data` array holds a single record."""
        records = entry.get("data") or []
        if not records or not isinstance(records[0], dict):
            return None
        record = records[0]
        date_created = record.get("date_created")
        return {
            "nasa_id": str(record.get("nasa_id") or "").strip() or None,
            "title": record.get("title"),
            "date_created": str(date_created)[:10] if date_created else None,
            "decade": decade_of(date_created),
            "center": record.get("center"),
            "media_type": record.get("media_type"),
            "album": [str(name) for name in (record.get("album") or [])],
            "keywords": [str(word) for word in (record.get("keywords") or [])][:12],
            "description": record.get("description"),
            "collection_url": entry.get("href"),
            "assets": NasaMediaData._assets(entry.get("links") or []),
        }

    @staticmethod
    def _assets(links: list) -> list[dict]:
        """The direct file links, biggest first. A preview thumbnail is not one."""
        rows = []
        for link in links:
            if not isinstance(link, dict):
                continue
            href = link.get("href")
            if not href or link.get("rel") == "preview":
                continue
            rows.append({"href": str(href), "rel": str(link.get("rel") or "alternate"),
                         "render": link.get("render"),
                         "width": link.get("width"), "height": link.get("height"),
                         "size": link.get("size")})
        rows.sort(key=lambda row: (row.get("size") or 0), reverse=True)
        return rows
