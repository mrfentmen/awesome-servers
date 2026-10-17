"""Tests for the Lichess chess server.

    python3 servers/chess/tests/test_agent.py
"""

from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = SERVER_DIR.parents[1]
for path in (str(SERVER_DIR), str(REPO_ROOT)):
    if path not in sys.path:
        sys.path.insert(0, path)


from agent import (  # noqa: E402
    CARD_SKILLS,
    SKILL_PLAYER_FORM,
    LichessAgent,
    parse,
    player_from_text,
)
from data import (  # noqa: E402
    DATASET,
    LichessClient,
    result_for,
    side_for,
)

PLAYER = "thibault"

USER_PAYLOAD = {
    "id": "thibault",
    "username": "thibault",
    "title": None,
    "flair": "food-drink.hot-dog",
    "patron": True,
    "verified": False,
    "createdAt": 1290415680000,
    "seenAt": 1790625630281,
    "playTime": {"total": 6675019, "tv": 18024},
    "count": {"all": 23886, "rated": 21491, "draw": 1059, "loss": 11422, "win": 11400,
              "bookmark": 80, "playing": 0, "import": 73, "me": 0},
    "perfs": {
        "ultraBullet": {"games": 3, "rating": 1688, "rd": 362, "prog": 0, "prov": True},
        "bullet": {"games": 7483, "rating": 1774, "rd": 100, "prog": -22},
        "blitz": {"games": 11888, "rating": 1724, "rd": 45, "prog": -7},
        "rapid": {"games": 915, "rating": 1802, "rd": 70, "prog": -75},
        "classical": {"games": 25, "rating": 1858, "rd": 248, "prog": 48, "prov": True},
        "correspondence": {"games": 377, "rating": 1942, "rd": 174, "prog": -12, "prov": True},
    },
}

GAME = {
    "id": "JNUpaHZT",
    "rated": True,
    "variant": "standard",
    "speed": "blitz",
    "perf": "blitz",
    "createdAt": 1790617958034,
    "lastMoveAt": 1790618655261,
    "status": "resign",
    "source": "pool",
    "winner": "black",
    "clock": {"initial": 300, "increment": 3},
    "opening": {"eco": "B22", "name": "Sicilian Defense: Alapin Variation", "ply": 3},
    "players": {
        "white": {"user": {"name": "ofergrinberg", "id": "ofergrinberg"}, "rating": 1627,
                  "ratingDiff": -4},
        "black": {"user": {"name": "thibault", "id": "thibault", "patron": True}, "rating": 1720,
                  "ratingDiff": 4},
    },
    # Castling ("O-O") is written with a hyphen and promotion with "=", so both are here:
    # a narrow move pattern would drop the move list of a real game.
    "moves": "e4 c5 c3 Nc6 d4 cxd4 cxd4 d6 Nf3 Nf6 Nc3 a3 O-O h3 Bxf3 Bxf3",
}

LOSS = {
    **GAME,
    "id": "AAAaaa11",
    "winner": "white",
    "lastMoveAt": 1790610000000,
    "opening": {"eco": "C50", "name": "Italian Game", "ply": 4},
    "players": {
        "white": {"user": {"id": "thibault"}, "rating": 1720, "ratingDiff": -8},
        "black": {"user": {"id": "someone"}, "rating": 1740, "ratingDiff": 8},
    },
    "moves": "e4 e5 Nf3 Nc6 Bc4",
}

ABORTED = {**GAME, "id": "BBBbbb22", "status": "aborted", "winner": None,
           "lastMoveAt": 1790600000000}

EXPORT_PAYLOAD = {**GAME, "analysis": {"status": "good"}, "literate": True}

OPENING_PAYLOAD = {"opening": {"eco": "B22", "name": "Sicilian Defense"}}

NDJSON = "\n".join(json.dumps(row) for row in (GAME, LOSS, ABORTED))


def _no_network(*args, **kwargs):
    raise AssertionError("FakeLichess must not touch the network")


def fetch_from(payloads, calls=None):
    """A JsonApiClient `fetch` that dispatches on path, so data.py runs for real."""

    def fetch(url, params, headers):
        if calls is not None:
            calls.append((url, dict(params)))
        # The client hands the whole URL, so the markers are matched anywhere in it.
        if "/api/games/user/" in url:
            return payloads["games"]
        if "/api/user/" in url:
            return payloads["user"]
        if "/game/export/" in url:
            return payloads["game"]
        if "/opening/" in url:
            return payloads["opening"]
        raise AssertionError(f"unexpected url {url}")

    return fetch


def fetch_text_from(body, calls=None):
    """The NDJSON reader, injectable for the same reason the JSON fetch is."""

    def fetch_text(url, params, headers):
        if calls is not None:
            calls.append((url, dict(params)))
        return body

    return fetch_text


def client(**payloads):
    base = {"user": USER_PAYLOAD, "games": NDJSON, "game": EXPORT_PAYLOAD,
            "opening": OPENING_PAYLOAD}
    base.update(payloads)
    return LichessClient(fetch=fetch_from(base), fetch_text=fetch_text_from(base["games"]))


def calls_client():
    fetch_calls: list[dict] = []
    text_calls: list[dict] = []
    api = LichessClient(
        fetch=fetch_from({"user": USER_PAYLOAD, "games": NDJSON, "game": EXPORT_PAYLOAD,
                          "opening": OPENING_PAYLOAD}, fetch_calls),
        fetch_text=fetch_text_from(NDJSON, text_calls),
    )
    return api, fetch_calls, text_calls


class ValidationTests(unittest.TestCase):
    def test_check_player(self):
        self.assertEqual(LichessClient.check_player(" thibault "), "thibault")
        for bad in ("", "has space", "-dash", "a" * 31, "a@b"):
            with self.assertRaises(ValueError):
                LichessClient.check_player(bad)

    def test_check_game_id_and_max(self):
        self.assertEqual(LichessClient.check_game_id("JNUpaHZT"), "JNUpaHZT")
        for bad in ("JNUpaHZ", "JNUpaHZT9", "jnupa hzt"):
            with self.assertRaises(ValueError):
                LichessClient.check_game_id(bad)
        self.assertEqual(LichessClient.check_max(None), 20)
        with self.assertRaises(ValueError):
            LichessClient.check_max("0")
        with self.assertRaises(ValueError):
            LichessClient.check_max("61")

    def test_check_opening(self):
        self.assertEqual(LichessClient.check_opening(" Sicilian Defense "), "sicilian defense")
        with self.assertRaises(ValueError):
            LichessClient.check_opening("!!!")
        with self.assertRaises(ValueError):
            LichessClient.check_opening("")

    def test_side_and_result(self):
        self.assertEqual(side_for(GAME, "thibault"), "black")
        self.assertEqual(side_for(GAME, "ofergrinberg"), "white")
        self.assertIsNone(side_for(GAME, "nobody"))
        self.assertEqual(result_for(GAME, "black"), "win")
        self.assertEqual(result_for(GAME, "white"), "loss")
        self.assertEqual(result_for({"status": "stalemate", "winner": None}, "white"), "draw")
        self.assertEqual(result_for({"status": "outoftime", "winner": None, "loser": "black"},
                                    "black"), "loss")
        self.assertEqual(result_for({"status": "outoftime", "winner": None, "loser": "black"},
                                    "white"), "win")


class ReaderTests(unittest.TestCase):
    def test_player_reads_ratings_in_order_and_the_record(self):
        player = client().player("thibault")
        self.assertEqual(player["id"], "thibault")
        self.assertEqual([row["perf"] for row in player["ratings"]],
                         ["ultraBullet", "bullet", "blitz", "rapid", "classical", "correspondence"],
                         "shortest games first, longest last")
        blitz = [row for row in player["ratings"] if row["perf"] == "blitz"][0]
        self.assertEqual(blitz["rating"], 1724)
        self.assertEqual(blitz["deviation"], 45)
        self.assertEqual(blitz["progress"], -7)
        self.assertEqual(player["record"]["all"], 23886)
        self.assertEqual(player["record"]["win"], 11400)

    def test_player_marks_provisional_ratings(self):
        player = client().player("thibault")
        provisional = {row["perf"] for row in player["ratings"] if row["provisional"]}
        self.assertEqual(provisional, {"ultraBullet", "classical", "correspondence"})

    def test_a_perf_with_no_games_is_left_out(self):
        perfs = {**USER_PAYLOAD, "perfs": {"blitz": {"games": 0, "rating": 1500}}}
        self.assertEqual(client(user=perfs).player("thibault")["ratings"], [])

    def test_unknown_player_is_none(self):
        from a2a_kit import UpstreamError

        def missing(url, params, headers):
            raise UpstreamError("LICHESS request failed: HTTP Error 404: Not Found")

        api = LichessClient(fetch=missing, fetch_text=fetch_text_from(NDJSON))
        self.assertIsNone(api.player("nosuchplayer"))
        with self.assertRaises(ValueError):
            api.player("not a username")

    def test_games_are_read_from_ndjson(self):
        api, fetch_calls, text_calls = calls_client()
        games = api.games("thibault", count=3)
        self.assertEqual([game["id"] for game in games], ["JNUpaHZT", "AAAaaa11", "BBBbbb22"])
        self.assertEqual(len(text_calls), 1, "the game list is one NDJSON read")
        self.assertEqual(text_calls[0][1]["max"], 3)
        self.assertEqual(text_calls[0][1]["opening"], "true")

    def test_a_bare_line_is_skipped_not_fatal(self):
        body = NDJSON + "\n\nnot json at all\n"
        api = LichessClient(fetch=fetch_from({"user": USER_PAYLOAD, "games": body,
                                              "game": EXPORT_PAYLOAD, "opening": OPENING_PAYLOAD}),
                            fetch_text=fetch_text_from(body))
        self.assertEqual(len(api.games("thibault", count=5)), 3)

    def test_a_game_outside_the_player_is_left_out(self):
        body = json.dumps({**GAME, "players": {"white": {"user": {"id": "someone"}},
                                               "black": {"user": {"id": "other"}}}})
        api = LichessClient(fetch=fetch_from({"user": USER_PAYLOAD, "games": body,
                                              "game": EXPORT_PAYLOAD, "opening": OPENING_PAYLOAD}),
                            fetch_text=fetch_text_from(body))
        self.assertEqual(api.games("thibault", count=5), [])

    def test_games_carry_side_result_and_opening(self):
        game = client().games("thibault", count=1)[0]
        self.assertEqual(game["side"], "black")
        self.assertEqual(game["result"], "win")
        self.assertEqual(game["opponent"], "ofergrinberg")
        self.assertEqual(game["my_rating"], 1720)
        self.assertEqual(game["my_rating_change"], 4)
        self.assertEqual(game["time_control"], "300+3")
        self.assertEqual(game["opening"]["eco"], "B22")

    def test_game_by_id_carries_the_moves(self):
        game = client().game("JNUpaHZT")
        self.assertEqual(game["id"], "JNUpaHZT")
        self.assertEqual(game["move_count"], 16)
        self.assertTrue(game["moves"].startswith("e4 c5 c3"))
        self.assertIn("O-O", game["moves"], "castling is SAN with a hyphen")
        self.assertIsNone(game.get("side"), "no player asked, so no side is claimed")

    def test_game_by_id_from_a_players_side(self):
        game = client().game("JNUpaHZT", player="thibault")
        self.assertEqual(game["side"], "black")
        self.assertEqual(game["result"], "win")

    def test_game_by_id_for_someone_in_it_is_their_side(self):
        game = client().game("JNUpaHZT", player="ofergrinberg")
        self.assertEqual(game["side"], "white")
        self.assertEqual(game["result"], "loss")

    def test_game_by_id_for_a_stranger_is_refused(self):
        self.assertIsNone(client().game("JNUpaHZT", player="nosuchplayer"))

    def test_game_that_does_not_exist_is_none(self):
        api = client(game={})
        self.assertIsNone(api.game("JNUpaHZT"))

    def test_opening_dictionary_lookup(self):
        opening = client().opening("Sicilian Defense")
        self.assertEqual(opening["eco"], "B22")
        self.assertEqual(opening["name"], "Sicilian Defense")
        self.assertEqual(opening["slug"], "sicilian defense")

    def test_unknown_opening_is_none(self):
        from a2a_kit import UpstreamError

        def missing(url, params, headers):
            raise UpstreamError("LICHESS request failed: HTTP Error 404: Not Found")

        api = LichessClient(fetch=missing, fetch_text=fetch_text_from(NDJSON))
        self.assertIsNone(api.opening("Nonsense Opening"))

    def test_an_empty_opening_payload_is_none(self):
        self.assertIsNone(client(opening={}).opening("Sicilian Defense"))


class ParseTests(unittest.TestCase):
    def text(self, value):
        return parse({"parts": [{"kind": "text", "text": value}]})

    def test_profile_wording(self):
        for value in ("how strong is thibault on lichess?", "ratings for thibault"):
            request = self.text(value)
            self.assertEqual(request["skill"], "player-profile", value)
            self.assertEqual(request["params"]["player"], "thibault", value)

    def test_recent_games_wording(self):
        request = self.text("what has thibault been playing?")
        self.assertEqual(request["skill"], "recent-games")
        self.assertEqual(request["params"]["player"], "thibault")
        counted = self.text("last 20 games for thibault")
        self.assertEqual(counted["params"]["count"], "20")

    def test_game_detail_wording(self):
        request = self.text("show me game JNUpaHZT")
        self.assertEqual(request["skill"], "game-detail")
        self.assertEqual(request["params"]["game_id"], "JNUpaHZT")
        self.assertNotIn("player", request["params"], "a game id is not also a username")

    def test_opening_lookup_by_game_and_by_name(self):
        by_game = self.text("what opening is game JNUpaHZT?")
        self.assertEqual(by_game["skill"], "opening-lookup")
        self.assertEqual(by_game["params"]["game_id"], "JNUpaHZT")
        by_name = self.text("what opening is the sicilian defense?")
        self.assertEqual(by_name["skill"], "opening-lookup")
        self.assertEqual(by_name["params"]["opening"], "sicilian defense")

    def test_a_bare_username_is_a_player_not_a_game(self):
        request = self.text("thibault")
        self.assertEqual(request["skill"], "player-profile")
        self.assertEqual(request["params"]["player"], "thibault")
        self.assertNotIn("game_id", request["params"])

    def test_help_and_empty(self):
        self.assertEqual(self.text("")["skill"], "help")
        self.assertEqual(self.text("what can you do?")["skill"], "help")

    def test_explicit_json_wins(self):
        request = parse({"parts": [{"kind": "data", "data": {
            "skill": "recent-games", "player": "thibault", "count": 5}}]})
        self.assertEqual(request["skill"], "recent-games")
        self.assertEqual(request["params"]["count"], 5)
        self.assertTrue(request["explicit"])

    def test_player_extraction_is_conservative(self):
        self.assertEqual(player_from_text("how strong is thibault on lichess?", None), "thibault")
        self.assertIsNone(player_from_text("show me game JNUpaHZT", None, exclude="JNUpaHZT"))
        self.assertIsNone(player_from_text("ratings for thibault", "thibault"))


class SkillTests(unittest.TestCase):
















    def test_opening_lookup_needs_something(self):
        agent = LichessAgent(client=client())
        self.assertEqual(agent.missing("opening-lookup", {}), ["opening"])
        result = agent.run({"skill": "opening-lookup", "params": {}, "missing": ["opening"]})
        self.assertIn("Give me a game id", result["message"])

    def test_game_detail_needs_an_id(self):
        agent = LichessAgent(client=client())
        self.assertEqual(agent.missing("game-detail", {}), ["game_id"])
        result = agent.run({"skill": "game-detail", "params": {}, "missing": ["game_id"]})
        self.assertIn("eight-character", result["message"])





#: Shape copied from a live `chess_player_form` answer for thibault over 30 games.
FORM_PAYLOAD = {
    "player": "thibault",
    "title": None,
    "gamesRead": 30,
    "wins": 14,
    "draws": 4,
    "losses": 12,
    "winRate": 46.7,
    "longestWinStreak": 3,
    "ratingChange": -18,
    "gamesWithRatingChange": 30,
    "asWhite": {"wins": 8, "draws": 2, "losses": 5},
    "asBlack": {"wins": 6, "draws": 2, "losses": 7},
    "bySpeed": {
        "blitz": {"wins": 11, "draws": 3, "losses": 9, "total": 23},
        "rapid": {"wins": 3, "draws": 1, "losses": 3, "total": 7},
    },
    "ratings": [{"name": "blitz", "games": 11888, "rating": 1724, "rd": 45, "provisional": False}],
    "topRating": {"name": "blitz", "rating": 1724, "games": 11888},
    "openingsPlayed": 5,
    "repertoire": [
        {"name": "B22 Sicilian Defense: Alapin Variation", "eco": "B22",
         "openingName": "Sicilian Defense: Alapin Variation", "games": 9, "wins": 5,
         "draws": 1, "losses": 3},
        {"name": "C50 Italian Game", "eco": "C50", "openingName": "Italian Game",
         "games": 6, "wins": 3, "draws": 1, "losses": 2},
    ],
    "verdict": "roughly level over this run",
    "note": "Only rated games are counted.",
}

TOOL_ERROR_TEXT = "`chess_player_form` failed: Lichess throttled that request"


def _message(text, **extra):
    payload = {"kind": "message", "role": "user", "messageId": "test-message",
               "parts": [{"kind": "text", "text": text}]}
    payload.update(extra)
    return payload




class PlayerFormTests(unittest.TestCase):
    """The premium skill: parsing stays local, the form report comes from the gateway."""


    def test_the_free_skills_keep_their_own_questions(self):
        self.assertEqual(parse(_message("how strong is thibault on lichess?"))["skill"],
                         "player-profile")
        self.assertEqual(parse(_message("what has thibault been playing?"))["skill"],
                         "recent-games")
        self.assertEqual(parse(_message("show me game JNUpaHZT"))["skill"], "game-detail")
        self.assertEqual(parse(_message("what opening is game JNUpaHZT?"))["skill"],
                         "opening-lookup")

    def test_an_explicit_skill_id_is_honoured(self):
        parsed = parse(_message("anything at all", parts=[
            {"kind": "data", "data": {"skill": SKILL_PLAYER_FORM, "player": "thibault",
                                      "count": 30}}]))
        self.assertEqual(parsed["skill"], SKILL_PLAYER_FORM)
        self.assertEqual(parsed["params"]["player"], "thibault")
        self.assertEqual(parsed["params"]["count"], 30)




    def test_form_needs_a_player(self):
        agent = LichessAgent(client=client())
        self.assertEqual(agent.missing("player-form", {}), ["player"])
        result = agent.run({"skill": "player-form", "params": {}, "missing": ["player"]})
        self.assertIn("Which player?", result["message"])







if __name__ == "__main__":
    unittest.main()
