"""Chess ratings, records and recent games, from Lichess (keyless).

Verified live on 2026-09-28:

  https://lichess.org/api/user/thibault
      -> perfs: bullet 7483 games / 1774, blitz 11888 / 1724, rapid 915 / 1802,
         classical 25 / 1858, plus ratingDeviation and the per-category game counts
  https://lichess.org/api/user/nobodyhere12345
      -> HTTP 404 with {"error":"Not found"}
  https://lichess.org/api/games/user/thibault?max=2
      -> NDJSON: one PGN per game, Site/Elo/Result headers
  https://lichess.org/api/games/user/thibault?max=1&opening=true
      -> the same PGN plus [ECO "B22"] and [Opening "Sicilian Defense: Alapin Variation"]
  https://lichess.org/game/export/JNUpaHZT
      -> one game's PGN with the same headers

Three things the payloads make plain and this reader keeps. An unknown player is a **404 with
a JSON body**, not an empty object, so it is a real "no such player" and not a parse failure.
`provisional` is a per-category flag and a player with 3 bullet games has a rating that means
nothing, so it is reported next to the number. And `ratingDeviation` is how wide the rating's
error bar is: a 362-deviation rating is far less sure of itself than a 45-deviation one, which
is why the answer prints it rather than hiding it.
"""

from __future__ import annotations

import os
import re
import time
from urllib import parse, request
from urllib.error import HTTPError

API = "https://lichess.org"

DATASET = "Lichess (lichess.org)"

DEFAULT_USER_AGENT = "awesome-acps-chess/1.0 (+https://github.com/mrfentmen/awesome-acps)"

#: The rating categories Lichess publishes, fastest first. Each one is a real rating, and
#: a player can have all of them at once.
CATEGORIES = (
    ("ultraBullet", "Ultra Bullet"), ("bullet", "Bullet"), ("blitz", "Blitz"), ("rapid", "Rapid"),
    ("classical", "Classical"), ("correspondence", "Correspondence"),
    ("chess960", "Chess960"), ("kingOfTheHill", "King of the Hill"),
    ("threeCheck", "Three-check"), ("antichess", "Antichess"),
    ("atomic", "Atomic"), ("horde", "Horde"), ("racingKings", "Racing Kings"),
)

#: The time control in a PGN header, e.g. "300+3" for 5+3 blitz.
_PGN_TAG = re.compile(r'^\[([A-Za-z]+) "(.*)"\]$')


def category_from_text(text: str) -> str | None:
    """The rating category a reader asked about, or None."""
    lowered = str(text or "").lower()
    for key, label in CATEGORIES:
        if key.lower() in lowered or label.lower() in lowered:
            return key
    if "bullet" in lowered:
        return "bullet"
    if "blitz" in lowered:
        return "blitz"
    if "rapid" in lowered:
        return "rapid"
    return None


#: Words that are part of asking rather than part of a handle. The handle is the first word
#: that is not one of these, so "show me thibault's last 10 games" finds `thibault`.
_ASKING = frozenset("""
about and any are as at be by can could did do does for from games get give has have help how
i in is it its last list me my of on or please pull recent record records rating ratings score
should show shows tell the their them this to up was were what when where which who whom why
will with would you your opening openings played plays history
""".split())


def username_from_text(text: str) -> str | None:
    """A Lichess username, or None.

    Lichess has no name search: a player is looked up by the username they registered, so
    "thibault" or "@thibault" is what this finds and a real name is not guessed at. An
    "@handle" is always the handle; otherwise it is the first word of the question that is
    not part of asking.
    """
    work = str(text or "").strip()
    match = re.search(r"@([A-Za-z0-9][A-Za-z0-9_-]{1,38}[A-Za-z0-9])", work)
    if match:
        return match.group(1)
    for token in re.findall(r"[A-Za-z0-9][A-Za-z0-9_-]{2,30}", work):
        if token.lower() in _ASKING:
            continue
        if not token[0].isalpha():
            continue
        return token
    return None


def game_id_from_text(text: str) -> str | None:
    """A Lichess game id, which is eight characters of base58."""
    match = re.search(r"\b([1-9A-HJ-NP-Za-km-z]{8})\b", str(text or ""))
    return match.group(1) if match else None


def _date_of(created) -> str | None:
    """A joined date from Lichess's millisecond timestamp, or None when it is not one."""
    millis = None
    if isinstance(created, dict):
        millis = created.get("timestamp")
    elif isinstance(created, (int, float)):
        millis = created
    if millis is None:
        return str(created) if created else None
    import datetime

    return datetime.datetime.fromtimestamp(int(millis) / 1000,
                                           datetime.timezone.utc).strftime("%Y-%m-%d")


def _category_name(key: str) -> str:
    for name, label in CATEGORIES:
        if name == key:
            return label
    return key


class ChessError(RuntimeError):
    """Lichess could not be read."""


class ChessNotFound(ChessError):
    """Lichess answered 404, or knows no such player or game - a real 'nothing here'."""


def parse_pgn(text: str) -> list[dict]:
    """NDJSON of PGNs into one record per game, headers plus the moves.

    Lichess separates games with blank lines and puts one more blank line between the moves
    and the next game, so a game is found by starting at each `[Event ` line rather than by
    counting blank lines. The headers carry everything a question needs - players, ratings,
    result, and the ECO code and opening name when `opening=true` asked for them - and a game
    whose header has no opening is counted as unclassified rather than dropped.
    """
    games = []
    for block in re.split(r"\n(?=\[Event )", str(text or "").strip()):
        headers: dict[str, str] = {}
        moves = ""
        for index, line in enumerate(block.splitlines()):
            if not line.strip():
                #: The blank line after the headers ends the header block; the rest is moves.
                moves = "\n".join(block.splitlines()[index + 1:]).strip()
                break
            match = _PGN_TAG.match(line.strip())
            if not match:
                break
            headers[match.group(1)] = match.group(2)
        if "Result" not in headers:
            continue
        result = headers["Result"]
        white, black = headers.get("White"), headers.get("Black")
        if not white or not black:
            continue
        game_id = headers.get("GameId") or ""
        site = headers.get("Site") or ""
        link = site if site.startswith("http") else f"{API}/{game_id}"
        try:
            white_elo = int(headers.get("WhiteElo") or 0) or None
            black_elo = int(headers.get("BlackElo") or 0) or None
        except ValueError:
            white_elo = black_elo = None
        games.append({
            "id": game_id,
            "link": link,
            "date": headers.get("UTCDate") or headers.get("Date") or None,
            "time": headers.get("UTCTime"),
            "event": headers.get("Event"),
            "white": white,
            "black": black,
            "white_elo": white_elo,
            "black_elo": black_elo,
            "result": result,
            "time_control": headers.get("TimeControl"),
            "variant": headers.get("Variant") or "Standard",
            "eco": headers.get("ECO"),
            "opening": headers.get("Opening") or None,
            "moves": moves,
        })
    return games


class ChessData:
    """Lichess: one player's ratings, their recent games, or one game."""

    def __init__(self, fetch=None, cache_ttl: float = 600.0, timeout: float = 25.0,
                 user_agent: str | None = None) -> None:
        self.cache_ttl = float(os.environ.get("CHESS_CACHE_TTL", cache_ttl))
        self.timeout = float(os.environ.get("CHESS_HTTP_TIMEOUT", timeout))
        self.user_agent = (user_agent or os.environ.get("CHESS_USER_AGENT")
                           or DEFAULT_USER_AGENT)
        self._fetch = fetch or self._http_text
        self._cache: dict[str, tuple[float, object]] = {}

    # -- transport ---------------------------------------------------------

    def _http_text(self, url: str, accept: str = "*/*") -> str:
        req = request.Request(url, headers={"User-Agent": self.user_agent, "Accept": accept})
        try:
            with request.urlopen(req, timeout=self.timeout) as resp:
                return resp.read().decode("utf-8", "replace")
        except HTTPError as exc:
            if exc.code == 404:
                #: Lichess answers an unknown player with a JSON 404, not an empty 200.
                raise ChessNotFound("no such player or game") from exc
            raise ChessError(f"request failed: {exc}") from exc
        except Exception as exc:  # urllib raises many other types too
            raise ChessError(f"request failed: {exc}") from exc

    def _get(self, url: str, ttl: float | None = None, accept: str = "*/*") -> object:
        now = time.time()
        hit = self._cache.get(url)
        if hit and hit[0] > now:
            return hit[1]
        payload = self._fetch(url, accept)
        if isinstance(payload, bytes):
            payload = payload.decode("utf-8", "replace")
        self._cache[url] = (now + (ttl if ttl is not None else self.cache_ttl), payload)
        return payload

    # -- reads -------------------------------------------------------------

    def player(self, username: str) -> dict:
        """One player's profile and every rating category they have."""
        name = str(username or "").strip()
        if not name:
            raise ValueError("tell me which Lichess player, for example @thibault")
        import json as _json

        raw = self._get(f"{API}/api/user/{parse.quote(name)}", accept="application/json")
        payload = _json.loads(raw) if isinstance(raw, str) else raw
        if not isinstance(payload, dict) or not payload.get("id"):
            raise ChessNotFound(f"Lichess has no player called {name!r}")
        perfs = {}
        for key, _label in CATEGORIES:
            perf = (payload.get("perfs") or {}).get(key)
            if not isinstance(perf, dict) or not perf.get("games"):
                continue
            perfs[key] = {
                "games": perf.get("games"),
                "rating": perf.get("rating"),
                #: A 3-game rating is provisional, and the deviation says how unsure it is.
                "deviation": perf.get("rd"),
                "provisional": bool(perf.get("prov")),
                "change": perf.get("prog"),
            }
        return {
            "id": payload.get("id"),
            "username": payload.get("username") or payload.get("id"),
            "real_name": (payload.get("profile") or {}).get("realName") or None,
            "country": (payload.get("profile") or {}).get("country"),
            #: Lichess sends created as a millisecond timestamp, which a reader wants as a
            #: date rather than as a raw epoch.
            "created": _date_of(payload.get("created")),
            "play_time": (payload.get("playTime") or {}).get("total"),
            "url": f"{API}/@{payload.get('id')}",
            "perfs": perfs,
        }

    def games(self, username: str, count: int = 10, openings: bool = True) -> list[dict]:
        """A player's most recent games, newest first, as Lichess's PGNs carry them."""
        name = str(username or "").strip()
        if not name:
            raise ValueError("tell me which Lichess player, for example @thibault")
        wanted = max(1, min(int(count), 100))
        query = f"max={wanted}&moves=false&accuracies=false&eval=false&literate=false"
        if openings:
            query += "&opening=true"
        raw = self._get(f"{API}/api/games/user/{parse.quote(name)}?{query}",
                        ttl=300.0, accept="application/x-chess-pgn")
        games = parse_pgn(raw if isinstance(raw, str) else str(raw))
        if not games:
            raise ChessNotFound(f"Lichess has no public game for {name!r}")
        return games

    def game(self, game_id: str) -> dict:
        """One game, with its PGN."""
        wanted = str(game_id or "").strip()
        if not wanted:
            raise ValueError("tell me which game, for example JNUpaHZT")
        raw = self._get(f"{API}/game/export/{parse.quote(wanted)}",
                        ttl=3600.0, accept="application/x-chess-pgn")
        games = parse_pgn(raw if isinstance(raw, str) else str(raw))
        if not games:
            raise ChessNotFound(f"Lichess has no game {wanted!r}")
        return games[0]
