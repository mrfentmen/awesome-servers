"""xkcd comics, one at a time or a run of them, keyless.

Verified live on 2026-09-28:

  https://xkcd.com/info.0.json
      -> num 3303 'Slab Graveyard', 2026-09-26, with the image URL and the alt text
  https://xkcd.com/3000/info.0.json
      -> num 3000 'Experimental Astrophysics', 2024-10-18
  https://xkcd.com/1500/info.0.json / 1600 / 1650 / 2000 / 3300
      -> transcripts of 763, 596, 0, 0, 0 characters

Three things the payloads make plain and this reader keeps. `alt` is always published and is
the joke in words, so it is the answer whenever a comic is asked about. `transcript` is
**only** there for the early run: it is full at comic 1600 and empty at 1650, 2000 and 3300,
because xkcd stopped publishing transcripts. And `info.0.json` is the *latest* comic, not
comic zero - which is the one thing that makes a "latest comic" question a single request.
"""

from __future__ import annotations

import json
import os
import re
import time
from urllib import request
from urllib.error import HTTPError

API = "https://xkcd.com"

DATASET = "xkcd (xkcd.com)"

DEFAULT_USER_AGENT = "awesome-acps-comics/1.0 (+https://github.com/mrfentmen/awesome-acps)"

#: The newest comic xkcd has published is in the 3300s; asking for a number far past that is
#: a typo or a guess, and is refused rather than answered with an error page.
MAX_KNOWN = 4000


class ComicsError(RuntimeError):
    """xkcd could not be read."""


class ComicsNotFound(ComicsError):
    """xkcd answered 404, or has no such comic - a real 'nothing here', not a failure."""


def number_from_text(text: str) -> int | None:
    """A comic number written as a number, `xkcd 3000`, `comic #3000` or `number 3000`."""
    work = str(text or "")
    match = re.search(r"#\s*(\d{1,4})\b", work)
    if match:
        return int(match.group(1))
    match = re.search(r"\b(?:comic|number|num|no)\s*(\d{1,4})\b", work, re.IGNORECASE)
    if match:
        return int(match.group(1))
    match = re.search(r"\bxkcd\s*(\d{1,4})\b", work, re.IGNORECASE)
    if match:
        return int(match.group(1))
    return None


def range_from_text(text: str, max_span: int = 20) -> tuple[int, int] | None:
    """A comic range written as 2998-3002, or "2998 to 3002".

    `max_span` is how wide a run the caller is willing to read: the free run caps at 20
    comics, while the premium word count caps much lower and reports what it truncated, so
    it asks for a wider range here and lets the gateway say so.
    """
    work = str(text or "").lower().replace("–", "-").replace("—", "-")
    match = re.search(r"\b(\d{1,4})\s*(?:-|to|through|thru|\.\.)\s*(\d{1,4})\b", work)
    if not match:
        return None
    first, second = int(match.group(1)), int(match.group(2))
    if second < first:
        return None
    if second - first + 1 > max(1, int(max_span)):
        return None
    return first, second


def count_from_text(text: str) -> int | None:
    """How many comics back the reader is asking for: "the last 5 comics"."""
    match = re.search(r"\blast\s+(\d{1,2})\b", str(text or ""), re.IGNORECASE)
    if not match:
        return None
    count = int(match.group(1))
    return count if 1 <= count <= 20 else None


class ComicsData:
    """xkcd: the latest comic, one comic by number, or a short run of them."""

    def __init__(self, fetch=None, cache_ttl: float = 3600.0, timeout: float = 25.0,
                 user_agent: str | None = None) -> None:
        self.cache_ttl = float(os.environ.get("COMICS_CACHE_TTL", cache_ttl))
        self.timeout = float(os.environ.get("COMICS_HTTP_TIMEOUT", timeout))
        self.user_agent = (user_agent or os.environ.get("COMICS_USER_AGENT")
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
            raise ComicsNotFound(f"request failed: {exc}") from exc
        except Exception as exc:  # urllib raises many other types too
            raise ComicsError(f"request failed: {exc}") from exc

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
                raise ComicsError(f"xkcd returned something that is not JSON: {exc}") from exc
        self._cache[url] = (now + (ttl if ttl is not None else self.cache_ttl), payload)
        return payload

    # -- reads -------------------------------------------------------------

    @staticmethod
    def _clean(info: dict) -> dict:
        year = str(info.get("year") or "")
        month = str(info.get("month") or "").zfill(2)
        day = str(info.get("day") or "").zfill(2)
        return {
            "num": int(info.get("num")),
            "title": info.get("title") or "not reported",
            "date": f"{year}-{month}-{day}",
            "alt": (info.get("alt") or "").strip() or None,
            "transcript": (info.get("transcript") or "").strip() or None,
            "image": info.get("img") or None,
            "link": f"{API}/{int(info.get('num'))}/",
        }

    def latest(self) -> dict:
        """The newest comic. `info.0.json` is the latest, not comic zero."""
        payload = self._get(f"{API}/info.0.json", ttl=300.0)
        if not isinstance(payload, dict) or not payload.get("num"):
            raise ComicsError("xkcd did not name the latest comic")
        return self._clean(payload)

    def comic(self, number: int) -> dict:
        """One comic by its number."""
        try:
            wanted = int(number)
        except (TypeError, ValueError):
            raise ValueError("tell me a comic number, for example xkcd 3000") from None
        if wanted < 1 or wanted > MAX_KNOWN:
            raise ValueError(f"xkcd comic numbers start at 1 and {wanted} is past the newest one")
        payload = self._get(f"{API}/{wanted}/info.0.json")
        if not isinstance(payload, dict) or not payload.get("num"):
            raise ComicsNotFound(f"xkcd has no comic {wanted}")
        if int(payload["num"]) != wanted:
            #: A redirect to a different comic would be a different comic, not this one.
            raise ComicsNotFound(f"xkcd has no comic {wanted}")
        return self._clean(payload)

    def run(self, first: int, last: int) -> list[dict]:
        """A short run of comics, oldest first."""
        if last < first:
            raise ValueError(f"a run of comics cannot end at {last} and start at {first}")
        count = last - first + 1
        if count > 20:
            raise ValueError(f"ask for at most 20 comics at a time, not {count}")
        comics = []
        for number in range(first, last + 1):
            comics.append(self.comic(number))
        return comics
