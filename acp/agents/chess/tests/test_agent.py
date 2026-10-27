"""Tests for the chess agent: ratings, games, one game, routing and turns.

    python3 agents/chess/tests/test_agent.py

No network: the JSON and the PGN are injected, shaped like the live payloads read on
2026-09-28 (`/api/user/thibault` -> bullet 7483 games/1774/rd 100, blitz 11888/1724/rd 45,
rapid 915/1802, classical 25/1858 prov; an unknown player is HTTP 404 {"error":"Not found"};
`/api/games/user/thibault?max=1&opening=true` -> one PGN with [ECO "B22"]).
"""

from __future__ import annotations

import json
import queue
import sys
import threading
import unittest
from pathlib import Path

AGENT_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = Path(__file__).resolve().parents[3]
for path in (str(REPO_ROOT), str(AGENT_DIR)):
    if path not in sys.path:
        sys.path.insert(0, path)

from acp_kit import AcpClient, Connection, STOP_END_TURN, STOP_REFUSAL

from agent import route  # noqa: E402
from data import (ChessData, ChessError, ChessNotFound,  # noqa: E402
                  category_from_text, game_id_from_text, parse_pgn, username_from_text)

#: Exactly the shape `/api/user/thibault` answered with on 2026-09-28.
THIBAULT = {
    "id": "thibault", "username": "thibault", "created": {"timestamp": 1500000000},
    "profile": {"realName": "Thibault D.", "country": "FR"},
    "playTime": {"total": 987654},
    "perfs": {
        "ultraBullet": {"games": 3, "rating": 1688, "rd": 362, "prog": 0, "prov": True},
        "bullet": {"games": 7483, "rating": 1774, "rd": 100, "prog": -22},
        "blitz": {"games": 11888, "rating": 1724, "rd": 45, "prog": -7},
        "rapid": {"games": 915, "rating": 1802, "rd": 70, "prog": -75},
        "classical": {"games": 25, "rating": 1858, "rd": 248, "prog": 48, "prov": True},
        "correspondence": {"games": 377, "rating": 1942, "rd": 174, "prog": -12, "prov": True},
    },
}

#: A player Lichess has never heard of: a 404 with a JSON body, not an empty 200.
NOT_FOUND = {"error": "Not found"}


def pgn(game_id, white, white_elo, black, black_elo, result, eco="", opening="",
        time_control="300+3", date="2026.09.28", moves="1. e4 c5 2. Nf3 d6 0-1"):
    lines = ['[Event "rated blitz game"]',
             f'[Site "https://lichess.org/{game_id}"]',
             f'[Date "{date}"]',
             '[Round "-"]',
             f'[White "{white}"]',
             f'[Black "{black}"]',
             f'[Result "{result}"]',
             f'[GameId "{game_id}"]',
             f'[UTCDate "{date}"]',
             '[UTCTime "17:52:38"]',
             f'[WhiteElo "{white_elo}"]',
             f'[BlackElo "{black_elo}"]',
             '[Variant "Standard"]',
             f'[TimeControl "{time_control}"]']
    if eco:
        lines.append(f'[ECO "{eco}"]')
    if opening:
        lines.append(f'[Opening "{opening}"]')
    lines.append('[Termination "Normal"]')
    lines.append("")
    lines.append(moves)
    return "\n".join(lines)


#: One of thibault's games, exactly as the live feed answered it.
ONE_GAME_PGN = pgn("JNUpaHZT", "ofergrinberg", 1627, "thibault", 1720, "0-1", "B22",
                    "Sicilian Defense: Alapin Variation")

#: Two of them, the way `/api/games/user/thibault?max=2` returns them: header block, blank
#: line, moves, then a blank line before the next `[Event`.
GAMES_PGN = "\n\n".join([
    ONE_GAME_PGN,
    pgn("abCdEf12", "thibault", 1720, "magnuscarlsen", 2901, "1/2-1/2", "C67",
        "Ruy Lopez: Berlin Defense", time_control="180+2", date="2026.09.27",
        moves="1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 1/2-1/2"),
])


class FakeFeeds:
    def __init__(self, profile=None, games=None, one_game=None, not_found=False, fail=False):
        self.calls: list[tuple[str, str]] = []
        self.profile = profile if profile is not None else THIBAULT
        self.games = games if games is not None else GAMES_PGN
        self.one_game = one_game if one_game is not None else ONE_GAME_PGN
        self.not_found = not_found
        self.fail = fail

    def __call__(self, url: str, accept: str = "*/*"):
        self.calls.append((url, accept))
        if self.fail:
            raise ChessError("Lichess is unreachable")
        if self.not_found:
            raise ChessNotFound("no such player or game")
        if "/api/user/" in url:
            return json.dumps(self.profile)
        if "/api/games/" in url:
            return self.games
        if "/game/export/" in url:
            return self.one_game
        raise ChessError(f"unexpected url in test: {url}")


def make_data(**kw):
    feed = FakeFeeds(**kw)
    return ChessData(fetch=feed), feed


class HelperTests(unittest.TestCase):
    def test_a_handle_is_found_past_the_question_words(self):
        self.assertEqual(username_from_text("what is thibault rating?"), "thibault")
        self.assertEqual(username_from_text("show me the last 20 games by @drnknoll"),
                         "drnknoll")
        self.assertEqual(username_from_text("tell me about thibaults record"), "thibaults")
        self.assertIsNone(username_from_text("what can you do?"))

    def test_a_category_and_a_game_id(self):
        self.assertEqual(category_from_text("what is thibault blitz rating?"), "blitz")
        self.assertEqual(category_from_text("bullet?"), "bullet")
        self.assertIsNone(category_from_text("show me the last 10 games"))
        self.assertEqual(game_id_from_text("tell me about game JNUpaHZT"), "JNUpaHZT")
        self.assertIsNone(game_id_from_text("show me thibault last 10 games"))

    def test_a_pgn_becomes_headers_and_the_moves(self):
        games = parse_pgn(GAMES_PGN)
        self.assertEqual(len(games), 2)
        first = games[0]
        self.assertEqual(first["id"], "JNUpaHZT")
        self.assertEqual(first["result"], "0-1")
        self.assertEqual(first["white_elo"], 1627)
        self.assertEqual(first["eco"], "B22")
        self.assertEqual(first["opening"], "Sicilian Defense: Alapin Variation")
        self.assertIn("1. e4 c5", first["moves"])
        self.assertEqual(games[1]["result"], "1/2-1/2")
        #: A PGN with no opening in it is a game, not a failure.
        self.assertIsNone(parse_pgn(pgn("xyz12345", "a", 1500, "b", 1500, "1-0"))[0]["opening"])


class ReadTests(unittest.TestCase):
    def test_a_player_with_every_rating(self):
        data, feed = make_data()
        player = data.player("thibault")
        self.assertEqual(player["username"], "thibault")
        self.assertEqual(player["real_name"], "Thibault D.")
        self.assertEqual(player["country"], "FR")
        self.assertEqual(player["perfs"]["blitz"]["rating"], 1724)
        self.assertEqual(player["perfs"]["bullet"]["games"], 7483)
        self.assertEqual(player["perfs"]["blitz"]["deviation"], 45)
        #: Provisional is a real flag on a real rating, and it has to survive the cleaning.
        self.assertTrue(player["perfs"]["classical"]["provisional"])
        self.assertFalse(player["perfs"]["blitz"]["provisional"])
        #: ultraBullet has 3 games and a 362 deviation: still a rating, and still reported.
        self.assertEqual(player["perfs"]["ultraBullet"]["deviation"], 362)
        self.assertIn("/api/user/thibault", feed.calls[0][0])

    def test_games_are_parsed_with_their_openings(self):
        data, feed = make_data()
        games = data.games("thibault", count=2)
        self.assertEqual([game["id"] for game in games], ["JNUpaHZT", "abCdEf12"])
        self.assertEqual(games[0]["opening"], "Sicilian Defense: Alapin Variation")
        self.assertIn("opening=true", feed.calls[0][0])
        self.assertEqual(feed.calls[0][1], "application/x-chess-pgn")

    def test_one_game(self):
        data, feed = make_data()
        game = data.game("JNUpaHZT")
        self.assertEqual(game["white"], "ofergrinberg")
        self.assertEqual(game["black"], "thibault")
        self.assertEqual(game["link"], "https://lichess.org/JNUpaHZT")
        self.assertIn("1. e4 c5", game["moves"])
        self.assertIn("/game/export/JNUpaHZT", feed.calls[0][0])

    def test_an_unknown_player_is_a_real_404(self):
        data, _feed = make_data(not_found=True)
        with self.assertRaises(ChessNotFound):
            data.player("nobodyhere12345")
        data, _feed = make_data(games="")
        with self.assertRaises(ChessNotFound):
            data.games("thibault")
        data, _feed = make_data(fail=True)
        with self.assertRaises(ChessError):
            data.player("thibault")
        data, _feed = make_data()
        with self.assertRaises(ValueError):
            data.player("  ")


class RouteTests(unittest.TestCase):
    def test_the_free_skills(self):
        self.assertEqual(route("what is thibault rating?"),
                         ("chess-player", {"player": "thibault"}))
        self.assertEqual(route("what is thibault blitz rating?"),
                         ("chess-player", {"player": "thibault", "category": "blitz"}))
        self.assertEqual(route("show me thibault last 10 games"),
                         ("chess-games", {"player": "thibault", "count": 10}))
        self.assertEqual(route("tell me about game JNUpaHZT"),
                         ("chess-game", {"game_id": "JNUpaHZT"}))


    def test_help_and_another_subject(self):
        self.assertEqual(route("")[0], "help")
        self.assertEqual(route("what can you do?")[0], "help")
        self.assertEqual(route("what is the weather in Ohio?")[0], "help")


class QueueReader:
    def __init__(self):
        self._items: queue.Queue = queue.Queue()

    def push(self, text):
        self._items.put(text)

    def close(self):
        self._items.put(None)

    def __iter__(self):
        return self

    def __next__(self):
        item = self._items.get()
        if item is None:
            raise StopIteration
        return item


class WiredWriter:
    def __init__(self, reader):
        self.reader = reader

    def write(self, text):
        self.reader.push(text)

    def flush(self):
        pass

    def close(self):
        self.reader.close()


def connected_pair():
    to_agent, to_client = QueueReader(), QueueReader()
    return (
        Connection(to_agent, WiredWriter(to_client), name="agent"),
        Connection(to_client, WiredWriter(to_agent), name="client"),
    )


class TurnTests(unittest.TestCase):
    def turn(self, text: str, permission: str = "allow-once", **kw):
        from agent import ChessAgent

        agent_conn, client_conn = connected_pair()
        data, feed = make_data(**kw)
        agent = ChessAgent(agent_conn, data)
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission=permission)
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            return client.prompt(text, session_id), client, feed
        finally:
            client.stop()

    def test_a_rating_answer_carries_the_deviation(self):
        result, client, _ = self.turn("what is thibault rating?")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertEqual(len(client.permission_requests), 1)
        self.assertIn("Thibault D. (@thibault) on Lichess", result["text"])
        self.assertIn("FR", result["text"])
        self.assertIn("Blitz            1724", result["text"])
        self.assertIn("11888 game(s)   deviation 45", result["text"])
        self.assertIn("Ultra Bullet", result["text"])
        #: Three bullet games and a 362 deviation is a real rating that is barely a claim.
        self.assertIn("362", result["text"])
        self.assertIn("(provisional)", result["text"])

    def test_one_category_only(self):
        result, _, _ = self.turn("what is thibault blitz rating?")
        self.assertIn("Blitz: 1724", result["text"])
        self.assertIn("11888 game(s), deviation 45", result["text"])
        self.assertIn("-7 this week", result["text"])
        self.assertNotIn("Correspondence", result["text"])

    def test_a_games_answer_with_the_opening(self):
        result, _, _ = self.turn("show me thibault last 2 games")
        self.assertIn("2 recent game(s) by @thibault", result["text"])
        self.assertIn("WIN - as black vs ofergrinberg (1627), 300+3, "
                      "Sicilian Defense: Alapin Variation [B22] on 2026.09.28",
                      result["text"])
        self.assertIn("DRAW - as white vs magnuscarlsen (2901)", result["text"])
        self.assertIn("https://lichess.org/JNUpaHZT", result["text"])

    def test_a_game_answer(self):
        result, _, _ = self.turn("tell me about game JNUpaHZT")
        self.assertIn("game JNUpaHZT on Lichess", result["text"])
        self.assertIn("white: ofergrinberg (1627)", result["text"])
        self.assertIn("result: 0-1  (300+3)", result["text"])
        self.assertIn("opening: Sicilian Defense: Alapin Variation [B22]", result["text"])
        self.assertIn("1. e4 c5", result["text"])

    def test_help_asks_nothing(self):
        result, client, feed = self.turn("what can you do?")
        self.assertIn("Lichess", result["text"])
        self.assertEqual(client.permission_requests, [])
        self.assertEqual(feed.calls, [])

    def test_permission_denied_and_a_dead_api(self):
        result, _, _ = self.turn("what is thibault rating?", permission="reject")
        self.assertEqual(result["stopReason"], STOP_REFUSAL)
        result, _, _ = self.turn("what is thibault rating?", fail=True)
        self.assertIn("I could not read Lichess's API", result["text"])
        result, _, _ = self.turn("what is nobodyhere12345 rating?", not_found=True)
        self.assertIn("I could not read Lichess's API", result["text"])


# ---------------------------------------------------------------------------
#
# ---------------------------------------------------------------------------

#: What `chess_opening_report` answers for thibault's last 30 games.
REPORT_DATA = {
    "player": "thibault",
    "realName": "Thibault D.",
    "gamesRead": 30,
    "gamesRequested": 30,
    "record": "14-11-5",
    "scorePercent": 55,
    "distinctOpenings": 4,
    "bestOpening": {"opening": "Sicilian Defense: Najdorf Variation", "eco": "B90",
                    "games": 6, "wins": 4, "losses": 1, "draws": 1, "scorePercent": 75.0,
                    "averageOpponentRating": 1810},
    "worstOpening": {"opening": "Queen's Gambit Declined", "eco": "D37",
                     "games": 3, "wins": 0, "losses": 3, "draws": 0, "scorePercent": 0.0,
                     "averageOpponentRating": 1760},
    "openings": [
        {"opening": "Sicilian Defense: Najdorf Variation", "eco": "B90", "games": 6,
         "wins": 4, "losses": 1, "draws": 1, "scorePercent": 75.0, "averageOpponentRating": 1810},
        {"opening": "Queen's Gambit Declined", "eco": "D37", "games": 3,
         "wins": 0, "losses": 3, "draws": 0, "scorePercent": 0.0, "averageOpponentRating": 1760},
    ],
    "source": "Lichess (lichess.org/api/games)",
}

#: The exact refusal the gateway sends for a key it will not accept.






if __name__ == "__main__":
    unittest.main(verbosity=2)
