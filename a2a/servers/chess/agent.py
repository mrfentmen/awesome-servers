"""The Lichess agent: four free skills and one premium one.

  - player-profile:  a player's ratings per time control and their all-time record
  - recent-games:    a player's most recent games, with who they played and how it went
  - game-detail:     one game by its eight-character id, with the moves
  - opening-lookup:  the opening a game reached - ECO code, name and the line it starts from
  - player-form:     a form report worked out over a run of games - premium, on the gateway

Player-form is the one question the free skills cannot answer. `recent-games` hands
back game after game and leaves the counting to the reader; a form report needs every
game folded into one record - results by colour, results by time control, the openings
actually reached with a record in each, the rating change across the run. That work runs
behind the licence gateway, so a caller who has not paid gets the gateway's own message
and no form report at all.
"""

from __future__ import annotations

import os
import re

from a2a_kit import GatewayClient, SkillAgent, UpstreamError, empty_premium_answer, premium_call

from data import (
    DATASET,
    PERF_ORDER,
    SOURCE,
    LichessClient,
)

SKILL_PLAYER_PROFILE = "player-profile"
SKILL_RECENT_GAMES = "recent-games"
SKILL_GAME_DETAIL = "game-detail"
SKILL_OPENING_LOOKUP = "opening-lookup"
SKILL_PLAYER_FORM = "player-form"

DEFAULT_GAMES = 10
MAX_LISTED = 20
MAX_LISTED_MOVES = 24

CARD_SKILLS = [
    {
        "id": SKILL_PLAYER_PROFILE,
        "name": "Player ratings and record",
        "description": (
            "A Lichess player's ratings per time control - bullet, blitz, rapid, classical, "
            "correspondence - with each one's game count, rating deviation, rating trend and whether "
            "it is provisional, plus their all-time win, loss and draw record."
        ),
        "tags": ["chess", "player", "ratings", "record", "lichess"],
        "examples": [
            "how strong is thibault on lichess?",
            '{"skill": "player-profile", "player": "thibault"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_RECENT_GAMES,
        "name": "Recent games",
        "description": (
            "A player's most recent games on Lichess: opponent, the result from their side, both "
            "ratings and the rating change, time control, whether it was rated, the opening it "
            "reached, the status and the game id."
        ),
        "tags": ["chess", "games", "recent", "history", "lichess"],
        "examples": [
            "what has thibault been playing?",
            "last 20 games for thibault",
            '{"skill": "recent-games", "player": "thibault", "count": 20}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_GAME_DETAIL,
        "name": "One game's detail",
        "description": (
            "One game by its eight-character Lichess id: both players and their ratings and rating "
            "changes, the result, the time control, the opening, the status, and the moves in "
            "algebraic notation with the final clock readings."
        ),
        "tags": ["chess", "game", "moves", "detail", "lichess"],
        "examples": [
            "show me game JNUpaHZT",
            '{"skill": "game-detail", "game_id": "JNUpaHZT"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_OPENING_LOOKUP,
        "name": "Opening lookup",
        "description": (
            "The opening a game reached, from Lichess's own analysis: the ECO code, the opening's "
            "name, how many half-moves in it was recognised, and the moves of that opening line. "
            "Give the game id, or an opening's name to look the name itself up."
        ),
        "tags": ["chess", "opening", "eco", "line", "lichess"],
        "examples": [
            "what opening is game JNUpaHZT?",
            '{"skill": "opening-lookup", "game_id": "JNUpaHZT"}',
            '{"skill": "opening-lookup", "opening": "Sicilian Defense"}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
    {
        "id": SKILL_PLAYER_FORM,
        "name": "Form report",
        "description": (
            "A form report worked out over a run of a player's games: wins, draws and losses with a "
            "win rate, the same split by whether they had white, results by time control, the rating "
            "change across the run, the longest winning streak, and the openings they actually reached "
            "with a record in each. Premium: it runs behind a licence check."
        ),
        "tags": ["chess", "form", "analysis", "opening repertoire", "premium"],
        "examples": [
            "is thibault improving at the moment?",
            "build me a form report for thibault over 30 games",
            '{"skill": "player-form", "player": "thibault", "count": 30}',
        ],
        "inputModes": ["text/plain", "application/json"],
        "outputModes": ["application/json", "text/plain"],
    },
]

_PLAYER_ID_RE = re.compile(r"\b([A-Za-z0-9][A-Za-z0-9_]{1,29})\b")
_GAME_ID_RE = re.compile(r"\b([A-Za-z0-9]{8})\b")
#: The sentence is about a game rather than about a player, so a bare eight-character
#: token in it is a game id and not a username.
_GAME_ABOUT_RE = re.compile(r"\b(game|pgn|moves?|movelist|notation)\b", re.IGNORECASE)
_COUNT_RE = re.compile(r"\b(?:last|past|previous|top|first)?\s*(\d{1,2})\s*(?:games?|last|recent)\b",
                       re.IGNORECASE)
_MOVES_RE = re.compile(r"\b(moves?|movelist|notation|pgn)\b", re.IGNORECASE)
_OPENING_RE = re.compile(
    r"\b(?:what|which)\s+opening\b|\bopening (?:is|of|for|used|name)\b|"
    r"\b(?:identify|name)\s+(?:the\s+)?opening\b|\bwhat does .{0,30} play\b",
    re.IGNORECASE,
)
_RECENT_RE = re.compile(
    r"\b(?:recent|last|past|previous|latest|been playing|playing|games? (?:played|history))\b",
    re.IGNORECASE,
)
_PROFILE_RE = re.compile(
    r"\b(?:how strong|ratings?|rating|elo|record|how good|what (?:is|are) (?:their|his|her) "
    r"(?:rating|ratings)|profile|how many games|stats?)\b",
    re.IGNORECASE,
)
#: The premium skill asks for a verdict over a run of games. Deliberately narrow: a game
#: list stays with recent-games and a game id stays with game-detail.
_FORM_WORDS = re.compile(
    r"\b(form|on a run|on a streak|streak|improving|getting better|getting worse|"
    r"slump|repertoire|openings?\b[^.?!]{0,40}\bplays?\b|by opening|"
    r"results? by (?:time control|opening|colour|color)|"
    r"how (?:is|are) (?:they|he|she) doing|trend|build me a (?:form )?report|"
    r"form report|record over|across (?:the )?last \d+)\b",
    re.IGNORECASE,
)
#: Every ordinary word these questions are made of, so the lowercase fallback above can
#: tell "has" in "what has thibault been playing" from the name beside it.
_QUESTION_WORDS = {
    "about", "account", "after", "against", "all", "also", "always", "am", "and", "another",
    "anything", "are", "around", "asked", "ask", "back", "be", "been", "before", "being", "below",
    "best", "better", "between", "both", "build", "but", "by", "called", "can", "chess", "could",
    "colour", "control", "did", "does", "doing", "done", "draw", "draws", "during", "each",
    "else", "even", "ever", "every", "form", "for", "from", "game", "games", "get", "give",
    "goes", "going", "good", "got", "has", "have", "having", "he", "her", "here", "him", "his",
    "how", "i", "identify", "if", "improving", "in", "into", "is", "it", "its", "last", "latest",
    "level", "lichess", "like", "line", "list", "loss", "losses", "make", "me", "more", "most",
    "movelist", "moves", "much", "my", "name", "named", "need", "never", "new", "no", "not",
    "notation", "now", "of", "on", "one", "only", "openings", "opening", "or", "other", "our",
    "out", "over", "own", "past", "pgn", "play", "played", "playing", "player", "players", "please",
    "previous", "profile", "put", "rating", "ratings", "recent", "record", "repertoire", "report",
    "result", "results", "run", "said", "same", "says", "see", "she", "should", "show", "since",
    "slump", "so", "someone", "something", "still", "streak", "strong", "such", "take", "tell",
    "than", "that", "the", "their", "them", "then", "there", "these", "they", "thing", "things",
    "this", "those", "time", "to", "today", "together", "too", "total", "up", "us", "use", "very",
    "versus", "was", "way", "weak", "well", "were", "what", "when", "where", "which", "while",
    "who", "whose", "why", "will", "win", "wins", "with", "within", "without", "would", "yet",
    "you", "your",
}
#: Words that belong to the question rather than to an opening's name.
_OPENING_LEAD_STOPWORDS = {"about", "the", "a", "an", "is", "are", "was", "tell", "me", "name",
                           "identify", "which", "what", "whose", "that", "this", "of", "in", "and",
                           "opening", "openings", "does", "do", "did", "used", "play"}
#: Words that are the noun, not a name.
_NOT_OPENING = {"opening", "openings", "defence", "defense", "gambit", "attack", "system",
                "variation", "move", "moves", "line"}
_QUOTED_RE = re.compile(r"[\"“”'‘’]([^\"“”]{2,60})[\"“”'‘’]")
_PLAYER_CONNECTOR_RE = re.compile(
    r"\b(?:for|of|by|about|player|username|account|profile)\s+(?:an?\s+|the\s+)*"
    r"([A-Za-z0-9][A-Za-z0-9_]{1,29})",
    re.IGNORECASE,
)
_ALL_SKILLS = (SKILL_PLAYER_PROFILE, SKILL_RECENT_GAMES, SKILL_GAME_DETAIL,
               SKILL_OPENING_LOOKUP, SKILL_PLAYER_FORM)

HELP = (
    "I read Lichess, the open chess server. Ask me:\n"
    "  • how strong is thibault on lichess?\n"
    "  • what has thibault been playing?\n"
    "  • show me game JNUpaHZT\n"
    "  • what opening is game JNUpaHZT?\n"
    "  • is thibault improving at the moment?\n"
    "Ratings, records, openings and moves are Lichess's own, read live. Openings come from the "
    "analysis Lichess stores with the game, not from an opening database I would have to guess at."
)


def message_text(message: dict) -> str:
    parts = message.get("parts") or []
    return " ".join(part.get("text", "") for part in parts if part.get("kind") == "text").strip()


def message_data(message: dict) -> dict:
    merged: dict = {}
    for part in message.get("parts") or []:
        if part.get("kind") == "data" and isinstance(part.get("data"), dict):
            merged.update(part["data"])
    return merged


def _first(params: dict, *names, default=None):
    for name in names:
        if name in params and params[name] not in (None, ""):
            return params[name]
    return default


def player_from_text(text: str, player: str | None, exclude: str | None = None) -> str | None:
    """A Lichess username only when the text offers one.

    `exclude` is the game id already found in the sentence: usernames and game ids are both
    alphanumeric and often the same length, so "show me game JNUpaHZT" must not also read
    JNUpaHZT as a player.
    """
    if player:
        return None

    def usable(candidate: str) -> bool:
        # Lichess ids are case-insensitive, so the comparison is too.
        return bool(candidate) and candidate.lower() != (exclude or "").lower()
    blocked = {"the", "player", "games", "game", "last", "latest", "what", "how", "is", "are",
               "record", "opening", "moves", "show", "me", "id", "time", "control", "profile",
               "strong", "over", "for", "and", "report", "form", "moves", "detail", "detail"}
    quoted = _QUOTED_RE.search(text)
    if quoted:
        candidate = quoted.group(1).strip(" .,'’")
        if re.match(r"^[A-Za-z0-9][A-Za-z0-9_]{1,29}$", candidate) and usable(candidate):
            return candidate
    match = _PLAYER_CONNECTOR_RE.search(text)
    if match:
        candidate = match.group(1)
        if candidate.lower() not in blocked and usable(candidate):
            return candidate
    # "how strong is thibault on lichess" - the name sits before the site's name.
    match = re.search(r"\b([A-Za-z0-9][A-Za-z0-9_]{1,29})\s+(?:on|at|on the)?\s*lichess\b",
                      text, re.IGNORECASE)
    if match and usable(match.group(1)):
        return match.group(1)
    # A bare username on its own is the username.
    stripped = text.strip(" \t\n.?!,")
    if re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_]{1,29}", stripped) and usable(stripped):
        return stripped
    capitals = re.search(r"\b([A-Z][A-Za-z0-9_]{1,29})\b", text)
    if capitals:
        candidate = capitals.group(1)
        if candidate.lower() not in blocked and usable(candidate):
            return candidate
    # A lowercase name is a name too: "what has thibault been playing?" carries no capital.
    # The original spelling is returned, because a username is echoed back as it was given.
    for candidate in re.findall(r"\b[a-z][a-z0-9_]{2,29}\b", text):
        if candidate.lower() in blocked or not usable(candidate):
            continue
        if candidate.lower() in _QUESTION_WORDS:
            continue
        return candidate
    return None


def parse(message: dict) -> dict:
    """Incoming message -> {skill, params, explicit}. Never raises."""
    text = message_text(message)
    data = message_data(message)
    requested = _first(data, "skill", "skill_id")

    player = _first(data, "player", "username", "user")
    game_id = _first(data, "game_id", "game")
    opening = _first(data, "opening", "opening_name")
    count = _first(data, "count", "games", "limit")
    if count is None:
        found = _COUNT_RE.search(text)
        if found:
            count = found.group(1)

    if game_id is None:
        # A word after "game" is a game id. A bare eight-character token is only one when
        # the sentence is about a game: usernames are the same shape, so "thibault" alone is
        # a player and not a game.
        found = re.search(r"\bgame\s+(?:id\s+)?([A-Za-z0-9]{8})\b", text, re.IGNORECASE)
        if found:
            game_id = found.group(1)
        elif _GAME_ABOUT_RE.search(text):
            found = _GAME_ID_RE.search(text)
            if found and found.group(1) != (opening or "").lower():
                game_id = found.group(1)
    if opening is None:
        found = re.search(r"\bopening\s+(?:called|named)\s+([A-Za-z][A-Za-z0-9 '\-]{1,60})",
                          text, re.IGNORECASE)
        if found:
            opening = found.group(1).strip(" .,'’")
        else:
            # "the sicilian defense", "the king's gambit": named by what kind of opening it is.
            found = re.search(
                r"\b((?:[A-Za-z][A-Za-z0-9'\-]{1,20}\s+){0,5}"
                r"[A-Za-z][A-Za-z0-9'\-]{1,20}\s+(?:defence|defense|gambit|"
                r"variation|attack|system))\b", text, re.IGNORECASE)
            if found:
                # The question's own words come off the front: "tell me about the sicilian
                # defense" names the Sicilian Defense, not "about the sicilian defense".
                words = found.group(1).strip(" .,'’").split()
                while words and words[0].lower() in _OPENING_LEAD_STOPWORDS:
                    words.pop(0)
                candidate = " ".join(words).strip(" .,'’") or None
                # A name that is only the noun is not a name: "what opening" is a question.
                opening = None if candidate.lower() in _NOT_OPENING else candidate

    if player is None and opening is None:
        # An opening name is read as an opening, not also as a username: "tell me about the
        # sicilian defense" is not a player called "sicilian".
        player = player_from_text(text, None, exclude=game_id)
    asks_form = bool(_FORM_WORDS.search(text))
    asks_opening = bool(_OPENING_RE.search(text))
    asks_moves = bool(_MOVES_RE.search(text))
    asks_game = bool(_GAME_ABOUT_RE.search(text))

    if requested in _ALL_SKILLS:
        skill = requested
    elif asks_form:
        skill = SKILL_PLAYER_FORM
    elif asks_opening:
        skill = SKILL_OPENING_LOOKUP
    elif asks_moves:
        skill = SKILL_GAME_DETAIL
    elif bool(_RECENT_RE.search(text)):
        skill = SKILL_RECENT_GAMES
    elif _PROFILE_RE.search(text):
        skill = SKILL_PLAYER_PROFILE
    elif asks_game and not player:
        skill = SKILL_GAME_DETAIL
    elif opening:
        skill = SKILL_OPENING_LOOKUP
    else:
        skill = SKILL_PLAYER_PROFILE

    params: dict = {}
    for key, value in (("player", player), ("game_id", game_id), ("opening", opening),
                       ("count", count)):
        if value is not None:
            params[key] = value

    if not requested and (not text.strip() or re.search(r"\b(help|what can you do|commands?)\b", text, re.IGNORECASE)):
        skill, params = "help", {}
    explicit = bool(requested or asks_form or asks_opening or asks_moves
                    or _RECENT_RE.search(text) or _PROFILE_RE.search(text) or game_id)
    return {"skill": skill, "params": params, "explicit": explicit}


# -- shared shape ---------------------------------------------------------


def _artifact(params: dict, client: LichessClient, **extra) -> dict:
    artifact = {
        "dataset": DATASET,
        "product": "Lichess public API: player ratings, records, games and openings",
        "source": SOURCE,
        "freshness": client.freshness(),
    }
    artifact.update(extra)
    return artifact


def _missing_player() -> dict:
    return {
        "final_state": "input-required",
        "message": (
            "Which player? Give me a Lichess username such as “thibault” - letters, digits and "
            "underscores."
        ),
        "artifact": None,
        "watch": None,
    }


def _missing_game() -> dict:
    return {
        "final_state": "input-required",
        "message": "Which game? Give me its eight-character Lichess id, such as “JNUpaHZT”.",
        "artifact": None,
        "watch": None,
    }


def _resolve_player(params: dict, client: LichessClient):
    """(player, problem) - problem is a finished response body, or None."""
    identifier = params.get("player")
    if not identifier:
        return None, None
    try:
        player = client.player(identifier)
    except ValueError as exc:
        return None, {"final_state": "input-required", "message": str(exc),
                      "artifact": None, "watch": None}
    if player is None:
        return None, {
            "final_state": "completed",
            "message": (
                f"Lichess has no player called “{identifier}”. Usernames are letters, digits and "
                "underscores, and they are case-insensitive."
            ),
            "artifact": _artifact(params, client, player=None, query=identifier),
            "watch": None,
        }
    return player, None


# -- skills ---------------------------------------------------------------


def run_player_profile(params: dict, client: LichessClient) -> dict:
    player, problem = _resolve_player(params, client)
    if problem:
        return problem
    if player is None:
        return _missing_player()
    ratings = player.get("ratings") or []
    record = player.get("record") or {}
    artifact = _artifact(params, client, player=player, count=len(ratings))
    if not ratings:
        return {
            "final_state": "completed",
            "message": (
                f"Lichess has no rated games for {player['username']}, so there is no rating to "
                f"report. (Read live from {DATASET}.)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    lines = []
    for row in ratings:
        bits = [str(row["rating"]) if row["rating"] is not None else "rating not reported"]
        bits.append(f"over {row['games']} games")
        if row.get("deviation") is not None:
            bits.append(f"+/- {row['deviation']}")
        if row.get("progress") is not None:
            bits.append(f"trend {row['progress']:+d}")
        if row.get("provisional"):
            bits.append("provisional")
        lines.append(f"  • {row['perf']}: " + ", ".join(str(bit) for bit in bits))
    played = record.get("all")
    record_line = ""
    if played:
        played_games = record.get("win") or 0
        losses = record.get("loss") or 0
        draws = record.get("draw") or 0
        total = played_games + losses + draws
        share = f"{(played_games / total * 100):.1f}" if total else "not reported"
        record_line = (
            f"  • All time: {played} game(s), {played_games}W {losses}L {draws}D "
            f"({share}% wins)."
        )
        if record.get("rated"):
            record_line += f" Rated games: {record['rated']}."
    return {
        "final_state": "completed",
        "message": (
            f"Lichess ratings for {player['username']}"
            + (f" ({player['title']})" if player.get("title") else "")
            + ":\n" + "\n".join(lines) + "\n" + record_line +
            "\nA provisional rating has too few games behind it to be trusted yet. "
            f"Source: {DATASET} (read live)."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_recent_games(params: dict, client: LichessClient) -> dict:
    player, problem = _resolve_player(params, client)
    if problem:
        return problem
    if player is None:
        return _missing_player()
    count = client.check_max(params.get("count", DEFAULT_GAMES))
    games = client.games(player["id"], count=count)
    artifact = _artifact(params, client, player=player, count=count, games=games,
                         found=len(games), export_format="NDJSON")
    if not games:
        return {
            "final_state": "completed",
            "message": (
                f"Lichess returned no rated games for {player['username']}. (Read live from {DATASET}.)"
            ),
            "artifact": artifact,
            "watch": None,
        }
    lines = []
    for game in games[:MAX_LISTED]:
        bits = [f"  • {game.get('id')}"]
        bits.append(f"{game.get('side')} vs {game.get('opponent')}")
        bits.append(str(game.get("result") or "result not reported"))
        if game.get("my_rating") is not None:
            rating = f"rated {game['my_rating']}"
            if game.get("my_rating_change") is not None:
                rating += f" ({game['my_rating_change']:+d})"
            bits.append(rating)
        bits.append(str(game.get("time_control") or "time control not reported"))
        if game.get("opening") and game["opening"].get("name"):
            opening = game["opening"].get("eco") or "ECO not reported"
            bits.append(f"{opening} {game['opening']['name']}")
        bits.append(str(game.get("status")))
        lines.append(" - ".join(str(bit) for bit in bits))
    if len(games) > MAX_LISTED:
        lines.append(f"  • ... {len(games) - MAX_LISTED} more game(s) are in the artifact.")
    wins = sum(1 for game in games if game.get("result") == "win")
    losses = sum(1 for game in games if game.get("result") == "loss")
    return {
        "final_state": "completed",
        "message": (
            f"{len(games)} most recent game(s) for {player['username']}: {wins}W {losses}L.\n"
            + "\n".join(lines) +
            f"\nSource: {DATASET} (read live), read as NDJSON. For a verdict over these games "
            "rather than the list, ask for a form report."
        ),
        "artifact": artifact,
        "watch": None,
    }


def run_game_detail(params: dict, client: LichessClient) -> dict:
    game_id = params.get("game_id")
    if not game_id:
        return _missing_game()
    try:
        game_id = client.check_game_id(game_id)
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    player, problem = _resolve_player({"player": params.get("player")}, client)
    if problem:
        return problem
    game = client.game(game_id, player=(player or {}).get("id"))
    if game is None:
        return {
            "final_state": "completed",
            "message": (
                f"Lichess has no game with id {game_id}. Ids are eight characters and "
                f"case-insensitive. (Read live from {DATASET}.)"
            ),
            "artifact": _artifact(params, client, game_id=game_id, game=None),
            "watch": None,
        }
    white = game.get("white") or {}
    black = game.get("black") or {}
    lines = [
        f"  • {white.get('id')} vs {black.get('id')}",
        f"  • White {white.get('rating') if white.get('rating') is not None else 'rating not reported'}"
        + (f" ({white['rating_change']:+d})" if white.get("rating_change") is not None else "")
        + f" - black {black.get('rating') if black.get('rating') is not None else 'rating not reported'}"
        + (f" ({black['rating_change']:+d})" if black.get("rating_change") is not None else ""),
        f"  • Result: {game.get('winner') or 'no winner'} won" if game.get("winner")
        else "  • Result: draw",
        f"  • Status: {game.get('status')}"
        + (f" ({game.get('speed')}, {'rated' if game.get('rated') else 'unrated'})" if game.get("speed")
           else ""),
        f"  • Time control: {game.get('time_control') or 'not reported'}",
    ]
    opening = game.get("opening")
    if opening and opening.get("name"):
        lines.append(f"  • Opening: {opening.get('eco') or 'ECO not reported'} {opening['name']}"
                     + (f", recognised at half-move {opening['ply']}" if opening.get("ply") else ""))
    if player:
        lines.append(f"  • From {player['username']}'s side: {game.get('side')}, {game.get('result')}")
    moves = game.get("moves")
    if moves:
        plies = moves.split()
        shown = plies[:MAX_LISTED_MOVES]
        numbered = " ".join(
            f"{index // 2 + 1}." + ("" if index % 2 == 0 else " ") + f" {move}"
            if index % 2 == 0 else move
            for index, move in enumerate(shown)
        )
        lines.append(f"  • Moves ({game.get('move_count')} half-moves): {numbered}"
                     + (f" ... {len(plies) - len(shown)} more in the artifact."
                        if len(plies) > len(shown) else ""))
    else:
        lines.append("  • Moves: Lichess published none for this game")
    clocks = game.get("final") or {}
    if clocks.get("white_clock") is not None or clocks.get("black_clock") is not None:
        lines.append(f"  • Final clock: white {clocks.get('white_clock')}, "
                     f"black {clocks.get('black_clock')}")
    return {
        "final_state": "completed",
        "message": (
            f"Lichess game {game_id}:\n" + "\n".join(lines) + f"\nSource: {DATASET} (read live)."
        ),
        "artifact": _artifact(params, client, game_id=game_id, game=game),
        "watch": None,
    }


def run_opening_lookup(params: dict, client: LichessClient) -> dict:
    game_id = params.get("game_id")
    name = params.get("opening")
    if not game_id and not name:
        return {
            "final_state": "input-required",
            "message": (
                "Which opening? Give me a game id such as “JNUpaHZT” and I will report the opening "
                "that game reached, or an opening's name to look the name itself up."
            ),
            "artifact": None,
            "watch": None,
        }
    if game_id:
        try:
            game_id = client.check_game_id(game_id)
        except ValueError as exc:
            return {"final_state": "input-required", "message": str(exc),
                    "artifact": None, "watch": None}
        game = client.game(game_id)
        if game is None:
            return {
                "final_state": "completed",
                "message": (
                    f"Lichess has no game with id {game_id}, so there is no opening to look up. "
                    f"(Read live from {DATASET}.)"
                ),
                "artifact": _artifact(params, client, game_id=game_id, opening=None),
                "watch": None,
            }
        opening = game.get("opening")
        if not opening or not opening.get("name"):
            return {
                "final_state": "completed",
                "message": (
                    f"Lichess stored no opening analysis for game {game_id}. Lichess only reports an "
                    f"opening when its analysis recognised one, and it does not analyse every game. "
                    f"(Read live from {DATASET}.)"
                ),
                "artifact": _artifact(params, client, game_id=game_id, opening=None,
                                      opening_source="Lichess game analysis"),
                "watch": None,
            }
        moves = (game.get("moves") or "").split()
        ply = opening.get("ply")
        line = " ".join(moves[:ply]) if ply else None
        lines = [
            f"  • Opening: {opening.get('eco') or 'ECO not reported'} {opening['name']}",
        ]
        if ply:
            lines.append(f"  • Recognised at half-move {ply}, i.e. after {ply // 2} full move(s)")
        if line:
            lines.append(f"  • The line: {line}")
        if moves:
            lines.append(f"  • The game continued for {len(moves)} half-moves after that.")
        return {
            "final_state": "completed",
            "message": (
                f"Opening reached in game {game_id}:\n" + "\n".join(lines) +
                f"\nSource: {DATASET} (read live), from the analysis Lichess stored with the game."
            ),
            "artifact": _artifact(params, client, game_id=game_id, opening=opening,
                                  opening_line=line, opening_source="Lichess game analysis",
                                  half_moves=len(moves)),
            "watch": None,
        }

    try:
        name = client.check_opening(name)
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}
    opening = client.opening(name)
    if opening is None:
        return {
            "final_state": "completed",
            "message": (
                f"Lichess's opening dictionary has nothing for “{name}”. Give the game's id instead "
                f"and I will report the opening it reached. (Read live from {DATASET}.)"
            ),
            "artifact": _artifact(params, client, opening=None, query=name),
            "watch": None,
        }
    return {
        "final_state": "completed",
        "message": (
            f"Lichess opening: {opening['eco']} {opening['name']}.\n"
            f"Source: {DATASET} (read live), from Lichess's own opening dictionary."
        ),
        "artifact": _artifact(params, client, opening=opening, opening_source="Lichess opening dictionary"),
        "watch": None,
    }


def run_player_form(params: dict, client: LichessClient, gateway: GatewayClient) -> dict:
    """The premium form report. The counting runs on the gateway.

    Nothing here reads the game list: the gateway reads the games, folds them into one
    record and judges the run behind its licence check, so a caller who has not paid gets
    the gateway's own message and no form report at all.
    """
    identifier = params.get("player")
    if not identifier:
        return _missing_player()
    try:
        arguments = {"player": client.check_player(identifier)}
        if params.get("count") is not None:
            arguments["max"] = client.check_max(params["count"])
    except ValueError as exc:
        return {"final_state": "input-required", "message": str(exc), "artifact": None, "watch": None}

    read, refused = premium_call(gateway, "chess_player_form", arguments, {
        "dataset": DATASET, "player": arguments["player"],
    })
    if refused:
        return refused
    if not isinstance(read, dict) or not read.get("player"):
        return empty_premium_answer(
            "The licence gateway answered without naming the player, so there is nothing to report.",
            {"dataset": DATASET, "player": arguments["player"]},
        )

    name = read.get("player")
    lines = [
        f"{name}: {read.get('gamesRead')} rated game(s) read - {read.get('wins')}W "
        f"{read.get('draws')}D {read.get('losses')}L, a {read.get('winRate')}% win rate, so "
        f"{read.get('verdict')}.",
    ]
    as_white = read.get("asWhite") or {}
    as_black = read.get("asBlack") or {}
    lines.append(
        "  • With white: "
        + f"{as_white.get('wins')}W {as_white.get('draws')}D {as_white.get('losses')}L; "
        + "with black: "
        + f"{as_black.get('wins')}W {as_black.get('draws')}D {as_black.get('losses')}L."
    )
    by_speed = read.get("bySpeed") or {}
    if by_speed:
        lines.append("  • By time control: " + ", ".join(
            f"{speed} {row.get('wins')}W-{row.get('draws')}D-{row.get('losses')}L "
            f"({row.get('total')})"
            for speed, row in list(by_speed.items())[:8]))
    if read.get("ratingChange") is not None:
        lines.append(
            f"  • Rating change over the run: {read['ratingChange']:+d} across "
            f"{read.get('gamesWithRatingChange')} game(s)."
        )
    if read.get("longestWinStreak"):
        lines.append(f"  • Longest winning streak in the run: {read['longestWinStreak']}.")
    repertoire = read.get("repertoire") or []
    if repertoire:
        lines.append(f"  • Openings reached ({read.get('openingsPlayed')} in all):")
        for entry in repertoire[:8]:
            lines.append(
                f"    - {entry.get('eco') or 'ECO not reported'} {entry.get('openingName') or entry.get('name')}: "
                f"{entry.get('games')} game(s), {entry.get('wins')}W {entry.get('draws')}D "
                f"{entry.get('losses')}L"
            )
    if read.get("note"):
        lines.append(f"  • {read['note']}")
    lines.append(
        "\nComputed on the MCP gateway behind its licence check, from the games Lichess exported "
        f"({DATASET})."
    )
    artifact = {
        "dataset": DATASET,
        "source": SOURCE,
        "premium": True,
        "player": name,
        "title": read.get("title"),
        "games_read": read.get("gamesRead"),
        "wins": read.get("wins"),
        "draws": read.get("draws"),
        "losses": read.get("losses"),
        "win_rate": read.get("winRate"),
        "verdict": read.get("verdict"),
        "longest_win_streak": read.get("longestWinStreak"),
        "rating_change": read.get("ratingChange"),
        "as_white": as_white,
        "as_black": as_black,
        "by_speed": by_speed,
        "openings_played": read.get("openingsPlayed"),
        "repertoire": repertoire,
        "ratings": read.get("ratings"),
    }
    return {"final_state": "completed", "message": "\n".join(lines), "artifact": artifact, "watch": None}


class LichessAgent(SkillAgent):
    name = "lichess"
    card_name = "Lichess Chess Agent"
    card_description = (
        "Read-only agent over Lichess, the open chess server: a player's ratings per time control "
        "with their all-time record, their most recent games with opponents and results, one game's "
        "detail with its moves, and the opening a game reached with its ECO code. Every answer is "
        "read live from Lichess."
    )
    env_prefix = "LICHESS"
    datasets = (DATASET,)
    card_skills = CARD_SKILLS

    def __init__(self, client: LichessClient | None = None,
                 gateway: GatewayClient | None = None) -> None:
        self.client = client or LichessClient()
        # The documented <PREFIX>_GATEWAY_URL override is passed in explicitly:
        # the shared client otherwise only looks at A2A_GATEWAY_URL.
        self.gateway = gateway or GatewayClient(url=os.environ.get(f"{self.env_prefix}_GATEWAY_URL"))

    def parse(self, message: dict) -> dict:
        return parse(message)

    def missing(self, skill: str, params: dict) -> list[str]:
        if skill == SKILL_GAME_DETAIL:
            return [] if params.get("game_id") else ["game_id"]
        if skill == SKILL_OPENING_LOOKUP:
            return [] if (params.get("game_id") or params.get("opening")) else ["opening"]
        if skill == SKILL_PLAYER_FORM:
            return [] if params.get("player") else ["player"]
        return [] if params.get("player") else ["player"]

    def input_prompt(self, skill: str, missing: list[str]) -> str:
        if skill == SKILL_GAME_DETAIL:
            return _missing_game()["message"]
        if skill == SKILL_OPENING_LOOKUP:
            return (
                "Which opening? Give me a game id such as “JNUpaHZT” and I will report the opening "
                "that game reached, or an opening's name to look the name itself up."
            )
        return _missing_player()["message"]

    def run(self, request: dict) -> dict:
        skill = request["skill"]
        params = request["params"]
        if request["missing"]:
            return {
                "final_state": "input-required",
                "message": self.input_prompt(skill, request["missing"]),
                "artifact": None,
                "watch": None,
            }
        if skill == SKILL_PLAYER_FORM:
            return run_player_form(params, self.client, self.gateway)
        if skill == SKILL_RECENT_GAMES:
            return run_recent_games(params, self.client)
        if skill == SKILL_GAME_DETAIL:
            return run_game_detail(params, self.client)
        if skill == SKILL_OPENING_LOOKUP:
            return run_opening_lookup(params, self.client)
        if skill == SKILL_PLAYER_PROFILE:
            return run_player_profile(params, self.client)
        return {"final_state": "completed", "message": HELP, "artifact": None, "watch": None}


__all__ = [
    "CARD_SKILLS",
    "DEFAULT_GAMES",
    "HELP",
    "MAX_LISTED",
    "MAX_LISTED_MOVES",
    "PERF_ORDER",
    "SKILL_GAME_DETAIL",
    "SKILL_OPENING_LOOKUP",
    "SKILL_PLAYER_FORM",
    "SKILL_PLAYER_PROFILE",
    "SKILL_RECENT_GAMES",
    "LichessAgent",
    "UpstreamError",
    "message_data",
    "message_text",
    "parse",
    "player_from_text",
    "run_game_detail",
    "run_opening_lookup",
    "run_player_form",
    "run_player_profile",
    "run_recent_games",
]
