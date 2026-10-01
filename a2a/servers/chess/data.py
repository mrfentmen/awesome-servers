"""Read-only client for the Lichess public API.

Endpoints (keyless, verified live 2026-09-28):
  - /api/user/{id}                  ratings per time control, and the all-time record
  - /api/games/user/{id}            recent games, as NDJSON: one JSON object per line
  - /game/export/{gameId}           one game, with the opening it reached
  - /opening/{name}                 an opening's name and ECO code, by name

Three things about this API shape the client:

1. The game list is NDJSON, not JSON. The base client parses a body as one JSON
   document, so the NDJSON read has its own text path here: the fetch is injectable
   the same way, so unit tests never touch the network.
2. `explorer.lichess.ovh` answers HTTP 401 to an anonymous caller, so the opening
   explorer is not used. An opening is instead read from the `opening` object the game
   export carries - the ECO code and the name Lichess itself assigned.
3. A username is a Lichess id. It is validated against the id rules rather than being
   trusted, because it goes into a URL path, and a path is not a place to put an
   unvalidated string.

Anonymous callers are throttled, so nothing here loops: one read per question, and a
`/api/account` call is never made.
"""

from __future__ import annotations

import json
import re
from urllib import parse as urlparse
from urllib import request

from a2a_kit import JsonApiClient, UpstreamError, utc_now_iso

BASE_URL = "https://lichess.org"

USER_PATH = "/api/user/{player}"
GAMES_PATH = "/api/games/user/{player}"
GAME_PATH = "/game/export/{game}"
OPENING_PATH = "/opening/{name}"

DATASET = "lichess.org/api"
PRODUCT = "Lichess public API: player ratings, records, games and openings"
SOURCE = "Lichess (open chess server)"

PERF_FIELDS = ("games", "rating", "rd", "prog", "prov")
GAME_FIELDS = ("id", "speed", "perf", "variant", "rated", "status", "source", "createdAt",
               "lastMoveAt", "winner", "rated")

#: The time controls Lichess names, longest games last. Used to order an answer.
PERF_ORDER = ("ultraBullet", "bullet", "blitz", "rapid", "classical", "correspondence")
#: A game that never reached its normal end.
UNFINISHED = ("aborted", "unfinished")

#: Lichess usernames: letters, digits and underscores, starting with a letter or digit.
_ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_]{0,29}$")
#: A game id is eight letters or digits.
_GAME_ID_RE = re.compile(r"^[A-Za-z0-9]{8}$")
#: An opening name is what Lichess puts in its own URLs: lowercase, hyphens.
_OPENING_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9 '\-]{0,80}$")
#: The `moves` field is SAN in space-separated half-moves. Castling is written O-O and
#: promotion with "=", so the class is "letters, digits and SAN punctuation" - narrow
#: enough that a JSON object dropped in here is refused, wide enough for a real game.
_MOVES_RE = re.compile(r"^[A-Za-z0-8+#=?! \-]{1,4000}$")

__all__ = [
    "BASE_URL",
    "DATASET",
    "GAME_FIELDS",
    "GAMES_PATH",
    "GAME_PATH",
    "LichessClient",
    "OPENING_PATH",
    "PERF_FIELDS",
    "PERF_ORDER",
    "PRODUCT",
    "SOURCE",
    "UNFINISHED",
    "USER_PATH",
    "UpstreamError",
    "result_for",
    "side_for",
]


def _to_int(value) -> int | None:
    if value in (None, ""):
        return None
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def _to_float(value) -> float | None:
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def side_for(game: dict, player: str) -> str | None:
    """Which colour `player` had, or None when the game was not theirs."""
    players = game.get("players") if isinstance(game.get("players"), dict) else {}
    for colour in ("white", "black"):
        side = players.get(colour)
        user = side.get("user") if isinstance(side, dict) else None
        if isinstance(user, dict) and user.get("id") == player:
            return colour
    return None


def result_for(game: dict, side: str) -> str:
    """How the game ended for that side: win, loss or draw.

    An unfinished game with a winner still counts as that result, because Lichess has
    already decided it; an aborted or interrupted game with no winner is a draw.
    """
    status = str(game.get("status") or "").lower()
    winner = game.get("winner")
    if winner in ("white", "black"):
        return "win" if winner == side else "loss"
    if status in ("stalemate", "draw", "timeout", "repetition", "insufficient", "abandoned"):
        return "draw"
    if status in UNFINISHED:
        return "draw"
    if status == "outoftime":
        loser = game.get("loser")
        if loser == side:
            return "loss"
        if loser in ("white", "black"):
            return "win"
        return "draw"
    return "draw"


class LichessClient(JsonApiClient):
    env_prefix = "LICHESS"
    base_url = BASE_URL
    #: Ratings and records move slowly; the game list does not.
    default_ttl = 300.0

    def __init__(self, fetch=None, fetch_text=None, base_url=None, cache_ttl=None,
                 timeout=None, headers=None) -> None:
        super().__init__(fetch=fetch, base_url=base_url, cache_ttl=cache_ttl, timeout=timeout,
                         headers=headers)
        # The game export is NDJSON, which the base client cannot parse, so it gets its
        # own text reader. It is injectable for the same reason the JSON fetch is.
        self._fetch_text = fetch_text or self._http_get_text

    # -- validation --------------------------------------------------------

    @staticmethod
    def check_player(value) -> str:
        player = str(value).strip()
        if not _ID_RE.match(player):
            raise ValueError(
                "a Lichess username is letters, digits and underscores, up to 30 characters, "
                "starting with a letter or a digit"
            )
        return player

    @staticmethod
    def check_game_id(value) -> str:
        game_id = str(value).strip()
        if not _GAME_ID_RE.match(game_id):
            raise ValueError("a Lichess game id is eight characters, for example JNUpaHZT")
        return game_id

    @staticmethod
    def check_max(value, default: int = 20) -> int:
        count = _to_int(value)
        if count is None:
            count = default
        if not 1 <= count <= 60:
            raise ValueError("the number of games must be between 1 and 60; Lichess throttles bursts")
        return count

    @staticmethod
    def check_opening(value) -> str:
        name = str(value).strip()
        if not _OPENING_RE.match(name):
            raise ValueError("an opening name is letters, digits, spaces and hyphens")
        return name.lower()

    # -- transport ---------------------------------------------------------

    def _http_get_text(self, url: str, params: dict, headers: dict) -> str:
        """A GET whose body is text rather than one JSON document."""
        query = urlparse.urlencode(params) if params else ""
        full = f"{url}?{query}" if query else url
        req = request.Request(full, headers={**headers, "Accept": "application/x-ndjson"})
        try:
            with request.urlopen(req, timeout=self.timeout) as resp:
                return resp.read().decode("utf-8")
        except Exception as exc:
            raise UpstreamError(f"{self.env_prefix} request failed: {exc}") from exc

    def _ndjson(self, path: str, params: dict, ttl: float) -> list[dict]:
        """One JSON object per line, parsed into a list.

        A line that will not parse is skipped rather than failing the whole read: an
        export is a stream of independent games, and one bad line should not hide the rest.
        """
        full = self.absolute(path)
        key = f"ndjson:{full}:{json.dumps({k: str(v) for k, v in sorted(params.items())})}"

        def produce():
            body = self._fetch_text(full, params, self.headers())
            rows = []
            for line in (body or "").splitlines():
                stripped = line.strip()
                if not stripped:
                    continue
                try:
                    row = json.loads(stripped)
                except ValueError:
                    continue
                if isinstance(row, dict):
                    rows.append(row)
            return rows

        return self.cached(key, ttl, produce)

    # -- reads -------------------------------------------------------------

    def player(self, identifier) -> dict | None:
        """One player: their ratings per time control and their all-time record.

        None when Lichess has no such username. That is a 404 from the API, which the base
        client reports as an UpstreamError, so the "no such player" case is caught here.
        """
        player = self.check_player(identifier)
        try:
            payload = self.get_json(USER_PATH.format(player=player), {}, ttl=self.cache_ttl)
        except UpstreamError:
            return None
        if not isinstance(payload, dict) or not payload.get("username"):
            return None
        perfs = payload.get("perfs") if isinstance(payload.get("perfs"), dict) else {}
        ratings = []
        for key, perf in perfs.items():
            if not isinstance(perf, dict) or not perf.get("games"):
                continue
            ratings.append({
                "perf": key,
                "games": _to_int(perf.get("games")) or 0,
                "rating": _to_int(perf.get("rating")),
                "deviation": _to_int(perf.get("rd")),
                "progress": _to_int(perf.get("prog")),
                "provisional": perf.get("prov") is True,
            })
        ratings.sort(key=lambda row: (PERF_ORDER.index(row["perf"]) if row["perf"] in PERF_ORDER
                                      else len(PERF_ORDER), -row["games"]))
        count = payload.get("count") if isinstance(payload.get("count"), dict) else {}
        played = count.get("all")
        return {
            "id": payload.get("id"),
            "username": payload.get("username"),
            "title": payload.get("title"),
            "verified": payload.get("verified") is True,
            "flair": (payload.get("flair") or None),
            "created_at": payload.get("createdAt"),
            "seen_at": payload.get("seenAt"),
            "play_time_seconds": (payload.get("playTime") or {}).get("total")
            if isinstance(payload.get("playTime"), dict) else None,
            "ratings": ratings,
            "record": {
                "all": _to_int(count.get("all")),
                "rated": _to_int(count.get("rated")),
                "win": _to_int(count.get("win")),
                "loss": _to_int(count.get("loss")),
                "draw": _to_int(count.get("draw")),
                "bookmark": _to_int(count.get("bookmark")),
                "playing": _to_int(count.get("playing")),
            },
        }

    def games(self, player: str, count: int = 20, rated: bool | None = None,
              opening: bool = True) -> list[dict]:
        """A player's most recent games, newest first, with the opening each reached."""
        player = self.check_player(player)
        count = self.check_max(count)
        params = {"max": count, "opening": "true" if opening else "false"}
        if rated is not None:
            params["rated"] = "true" if rated else "false"
        rows = self._ndjson(GAMES_PATH.format(player=player), params, ttl=min(self.cache_ttl, 120.0))
        games = []
        for row in rows:
            game = self._game(row, player)
            if game is not None:
                games.append(game)
        games.sort(key=lambda game: game.get("last_move_at") or 0, reverse=True)
        return games[:count]

    def game(self, identifier: str, player: str | None = None) -> dict | None:
        """One game by id, with its opening and its move list."""
        game_id = self.check_game_id(identifier)
        payload = self.get_json(GAME_PATH.format(game=game_id), {"literate": "true"},
                                ttl=self.cache_ttl)
        if not isinstance(payload, dict) or not payload.get("id"):
            return None
        game = self._game(payload, player, moves=True)
        if game is None and player is None:
            # No player was asked about, so the game is reported whole.
            game = self._game(payload, None, moves=True)
        return game

    def opening(self, name: str) -> dict | None:
        """An opening by its own name: the ECO code and the name Lichess uses.

        This is Lichess's own opening dictionary, not the explorer: the explorer answers
        HTTP 401 to an anonymous caller, so nothing here depends on it.
        """
        key = self.check_opening(name)
        try:
            payload = self.get_json(OPENING_PATH.format(name=key), {}, ttl=86400.0)
        except UpstreamError:
            return None
        if not isinstance(payload, dict):
            return None
        opening = payload.get("opening") if isinstance(payload.get("opening"), dict) else payload
        eco = opening.get("eco")
        label = opening.get("name")
        if not eco and not label:
            return None
        return {"name": label or key, "eco": eco or "not reported", "slug": key}

    @staticmethod
    def freshness() -> str:
        """Every read here is live, so freshness is the moment we read it."""
        return utc_now_iso()

    # -- shaping -----------------------------------------------------------

    def _game(self, row: dict, player: str | None, moves: bool = False,
              any_side: bool = False) -> dict | None:
        """One game, shaped for an answer.

        With a player named, the game is refused unless that player is in it, and the
        result is stated from their side. With no player, the game is refused unless the
        caller allows either side.
        """
        if not isinstance(row, dict) or not row.get("id"):
            return None
        players = row.get("players") if isinstance(row.get("players"), dict) else {}
        white = players.get("white") if isinstance(players.get("white"), dict) else {}
        black = players.get("black") if isinstance(players.get("black"), dict) else {}
        white_user = white.get("user") if isinstance(white.get("user"), dict) else {}
        black_user = black.get("user") if isinstance(black.get("user"), dict) else {}
        if not white_user.get("id") or not black_user.get("id"):
            return None
        side = side_for(row, player) if player else None
        if player and side is None and not any_side:
            return None
        opening = row.get("opening") if isinstance(row.get("opening"), dict) else None
        status = str(row.get("status") or "unknown")
        game = {
            "id": row.get("id"),
            "speed": row.get("speed") or "not reported",
            "perf": row.get("perf") or row.get("speed") or "not reported",
            "variant": row.get("variant") or "standard",
            "rated": row.get("rated"),
            "status": status,
            "unfinished": status in UNFINISHED,
            "source": row.get("source") or "not reported",
            "created_at": row.get("createdAt"),
            "last_move_at": row.get("lastMoveAt"),
            "winner": row.get("winner"),
            "white": {
                "id": white_user.get("id"),
                "rating": _to_int(white.get("rating")),
                "rating_change": _to_int(white.get("ratingDiff")),
                "provisional": white.get("provisional") is True,
            },
            "black": {
                "id": black_user.get("id"),
                "rating": _to_int(black.get("rating")),
                "rating_change": _to_int(black.get("ratingDiff")),
                "provisional": black.get("provisional") is True,
            },
            "opening": {
                "eco": opening.get("eco"),
                "name": opening.get("name"),
                "ply": _to_int(opening.get("ply")),
            } if opening else None,
            "time_control": self._time_control(row),
        }
        if player and side:
            game["side"] = side
            game["result"] = result_for(row, side)
            me = game[side]
            opponent = game["black" if side == "white" else "white"]
            game["opponent"] = opponent["id"]
            game["opponent_rating"] = opponent["rating"]
            game["my_rating"] = me["rating"]
            game["my_rating_change"] = me["rating_change"]
        if moves:
            san = row.get("moves")
            game["moves"] = san if isinstance(san, str) and _MOVES_RE.match(san) else None
            game["move_count"] = len(game["moves"].split()) if game["moves"] else 0
            game["final"] = {
                "white_clock": (row.get("clock") or {}).get("last") if isinstance(row.get("clock"), dict) else None,
                "black_clock": (row.get("clock") or {}).get("last") if isinstance(row.get("clock"), dict) else None,
            }
        return game

    @staticmethod
    def _time_control(row: dict) -> str | None:
        clock = row.get("clock") if isinstance(row.get("clock"), dict) else {}
        initial = _to_int(clock.get("initial"))
        increment = _to_int(clock.get("increment"))
        if initial is None and increment is None:
            return None
        if initial is None:
            return f"+{increment}"
        if not increment:
            return f"{initial}s"
        return f"{initial}+{increment}"
