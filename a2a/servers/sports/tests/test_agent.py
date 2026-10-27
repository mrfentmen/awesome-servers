"""Tests for the ESPN sports server.

    python3 servers/sports/tests/test_agent.py
"""

from __future__ import annotations

import json
import sys
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = SERVER_DIR.parents[1]
for path in (str(SERVER_DIR), str(REPO_ROOT)):
    if path not in sys.path:
        sys.path.insert(0, path)


from agent import (  # noqa: E402
    CARD_SKILLS,
    SKILL_SLATE_BRIEF,
    EspnAgent,
    leagues_from_text,
    parse,
    team_from_text,
)
from data import (  # noqa: E402
    DATASET,
    LEAGUES,
    EspnClient,
    league_code,
    league_name,
    league_path,
)


def _event(**overrides) -> dict:
    """One scheduled NBA game, in the shape ESPN actually sends."""
    base = {
        "id": "401902644",
        "date": "2026-10-03T23:00Z",
        "name": "Miami Heat at Toronto Raptors",
        "shortName": "MIA @ TOR",
        "status": {
            "clock": 0.0, "displayClock": "0.0", "period": 0,
            "type": {
                "id": "1", "name": "STATUS_SCHEDULED", "state": "pre", "completed": False,
                "description": "Scheduled", "detail": "Sat, October 3rd at 7:00 PM EDT",
                "shortDetail": "10/3 - 7:00 PM EDT",
            },
        },
        "competitions": [
            {
                "id": "401902644",
                "venue": {"id": "1838", "fullName": "Scotiabank Arena", "city": "Toronto"},
                "broadcasts": [{"names": [{"shortDisplayName": "ESPN"}]}],
                "odds": [{"details": "MIA -2.5", "overUnder": 218.5, "spread": -2.5}],
                "notes": [{"headline": "Season opener"}],
                "competitors": [
                    {"id": "28", "homeAway": "home", "winner": False, "score": "0",
                     "records": [{"type": "overall", "summary": "0-0"}],
                     "team": {"id": "28", "location": "Toronto", "name": "Raptors",
                              "abbreviation": "TOR", "displayName": "Toronto Raptors",
                              "shortDisplayName": "Raptors", "isActive": True}},
                    {"id": "15", "homeAway": "away", "winner": False, "score": "0",
                     "records": [{"type": "overall", "summary": "0-0"}],
                     "team": {"id": "15", "location": "Miami", "name": "Heat",
                              "abbreviation": "MIA", "displayName": "Miami Heat",
                              "shortDisplayName": "Heat", "isActive": True}},
                ],
            }
        ],
    }
    base.update(overrides)
    return base


NBA_BOARD = {"leagues": [{"id": "46", "name": "National Basketball Association"}],
             "events": [_event()]}

NBA_TEAMS = {
    "sports": [
        {
            "leagues": [
                {
                    "teams": [
                        {"team": {"id": "1", "abbreviation": "ATL", "displayName": "Atlanta Hawks",
                                  "shortDisplayName": "Hawks", "location": "Atlanta", "name": "Hawks",
                                  "isActive": True,
                                  "links": [{"rel": ["clubhouse"],
                                             "href": "https://www.espn.com/nba/team/_/name/atl"}]}},
                        {"team": {"id": "28", "abbreviation": "TOR", "displayName": "Toronto Raptors",
                                  "shortDisplayName": "Raptors", "location": "Toronto",
                                  "name": "Raptors", "isActive": True, "links": []}},
                        {"team": {"id": "99", "abbreviation": "RET", "displayName": "Retired Reds",
                                  "shortDisplayName": "Reds", "location": "Nowhere", "name": "Reds",
                                  "isActive": False, "links": []}},
                    ]
                }
            ]
        }
    ]
}

NBA_STANDINGS = {
    "uid": "s:40~l:46",
    "id": "46",
    "name": "National Basketball Association",
    "abbreviation": "NBA",
    "children": [
        {
            "name": "Eastern Conference East",
            "abbreviation": "East",
            "standings": {
                "entries": [
                    {"team": {"id": "8", "abbreviation": "DET", "displayName": "Detroit Pistons",
                              "shortDisplayName": "Pistons", "location": "Detroit", "name": "Pistons",
                              "isActive": True, "links": []},
                     "stats": [{"name": "wins", "value": 41}, {"name": "losses", "value": 22},
                               {"name": "ties", "value": 0}, {"name": "winPercent", "value": 0.651},
                               {"name": "gamesBehind", "value": "-"},
                               {"name": "rank", "value": 1}, {"name": "playoffSeed", "value": 1}]},
                    {"team": {"id": "1", "abbreviation": "ATL", "displayName": "Atlanta Hawks",
                              "shortDisplayName": "Hawks", "location": "Atlanta", "name": "Hawks",
                              "isActive": True, "links": []},
                     "stats": [{"name": "wins", "value": 30}, {"name": "losses", "value": 33},
                               {"name": "ties", "value": 0}, {"name": "winPercent", "value": 0.476},
                               {"name": "gamesBehind", "value": "11.0"},
                               {"name": "rank", "value": 8}]},
                ]
            },
        }
    ],
    "seasons": [{"year": 2026, "type": {"id": "2", "name": "Regular Season"}}],
}

NBA_SUMMARY = {
    "header": {
        "id": "401902644",
        "competitions": [
            {
                "id": "401902644",
                "date": "2026-10-03T23:00Z",
                "name": "Miami Heat at Toronto Raptors",
                "shortName": "MIA @ TOR",
                "status": {"clock": 0.0, "displayClock": "0.0", "period": 0,
                           "type": {"id": "1", "name": "STATUS_SCHEDULED", "state": "pre",
                                    "completed": False, "detail": "Sat, October 3rd at 7:00 PM EDT"}},
                "venue": {"fullName": "Scotiabank Arena"},
                # A summary header carries `odds` as a bare object, not the scoreboard's array.
                "odds": {"details": "MIA -2.5", "overUnder": 218.5, "spread": -2.5},
                "notes": [{"headline": "Season opener"}],
                "broadcasts": [{"names": [{"shortDisplayName": "ESPN"}]}],
                "competitors": _event()["competitions"][0]["competitors"],
            }
        ],
    },
    "gameInfo": {
        "venue": {"fullName": "Scotiabank Arena"},
        "attendance": 19000,
        "officials": [{"displayName": "Referee One"}],
    },
    "boxscore": {},
}

#: A soccer event: the score sits on the competition and the draw is a string.
SOCCER_BOARD = {
    "events": [
        {
            "id": "700123",
            "date": "2026-09-29T14:00Z",
            "name": "Arsenal at Chelsea",
            "shortName": "ARS @ CHE",
            "status": {"type": {"id": "28", "name": "STATUS_FULL_TIME", "state": "post",
                                "completed": True, "detail": "FT"}},
            "competitions": [
                {
                    "score": {"value": 2.0, "displayValue": "2 - 2"},
                    "competitors": [
                        {"homeAway": "home", "score": "2",
                         "team": {"id": "362", "abbreviation": "CHE",
                                  "displayName": "Chelsea"}},
                        {"homeAway": "away", "score": "2",
                         "team": {"id": "359", "abbreviation": "ARS",
                                  "displayName": "Arsenal"}},
                    ],
                }
            ],
        }
    ]
}


def _no_network(*args, **kwargs):
    raise AssertionError("FakeEspn must not touch the network")


def fetch_from(payloads, calls=None):
    """A JsonApiClient `fetch` that dispatches on path, so data.py runs for real."""

    def fetch(url, params, headers):
        if calls is not None:
            calls.append((url, dict(params)))
        path = url.split("?")[0]
        if path.endswith("/scoreboard"):
            return payloads["scoreboard"](path) if callable(payloads["scoreboard"]) else payloads["scoreboard"]
        if path.endswith("/teams"):
            return payloads["teams"]
        if path.endswith("/standings"):
            return payloads["standings"]
        if path.endswith("/summary"):
            return payloads["summary"]
        raise AssertionError(f"unexpected url {url}")

    return fetch


def client(**payloads):
    base = {"scoreboard": NBA_BOARD, "teams": NBA_TEAMS, "standings": NBA_STANDINGS,
            "summary": NBA_SUMMARY}
    base.update(payloads)
    return EspnClient(fetch=fetch_from(base))


class ValidationTests(unittest.TestCase):
    def test_league_codes_aliases_and_paths(self):
        self.assertEqual(league_path("NBA"), "basketball/nba")
        self.assertEqual(league_path("epl"), "soccer/eng.1")
        self.assertEqual(league_path("premier league"), "soccer/eng.1")
        self.assertEqual(league_code("soccer"), "eng1")
        self.assertEqual(league_name("eng1"), "Premier League")
        self.assertEqual(EspnClient.check_league("Basketball"), "nba")
        with self.assertRaises(ValueError):
            EspnClient.check_league("curling")

    def test_every_league_has_a_name_and_a_path(self):
        for code, league in LEAGUES.items():
            self.assertEqual(league_path(code), league["path"])
            self.assertTrue(league["name"])

    def test_check_date_event_and_season(self):
        self.assertEqual(EspnClient.check_date("2026-09-28"), "2026-09-28")
        with self.assertRaises(ValueError):
            EspnClient.check_date("28-09-2026")
        with self.assertRaises(ValueError):
            EspnClient.check_date("2026-02-31")
        self.assertEqual(EspnClient.check_event_id(" 401902644 "), "401902644")
        with self.assertRaises(ValueError):
            EspnClient.check_event_id("abc")
        self.assertEqual(EspnClient.check_season("2026"), 2026)
        with self.assertRaises(ValueError):
            EspnClient.check_season("12")

    def test_check_limit(self):
        self.assertEqual(EspnClient.check_limit(None, default=40), 40)
        with self.assertRaises(ValueError):
            EspnClient.check_limit("0")
        with self.assertRaises(ValueError):
            EspnClient.check_limit("101")


class ReaderTests(unittest.TestCase):
    def test_scoreboard_maps_sides_state_and_odds(self):
        calls = []
        api = EspnClient(fetch=fetch_from({"scoreboard": NBA_BOARD, "teams": NBA_TEAMS,
                                          "standings": NBA_STANDINGS, "summary": NBA_SUMMARY}, calls))
        games = api.scoreboard("nba", day="2026-10-03")
        self.assertEqual(len(games), 1)
        game = games[0]
        self.assertEqual(game["away"]["team"], "Miami Heat")
        self.assertEqual(game["home"]["team"], "Toronto Raptors")
        self.assertEqual(game["state"], "pre")
        self.assertEqual(game["detail"], "Sat, October 3rd at 7:00 PM EDT")
        self.assertEqual(game["venue"], "Scotiabank Arena")
        self.assertEqual(game["broadcast"], "ESPN")
        self.assertEqual(game["odds"]["over_under"], 218.5)
        self.assertEqual(game["notes"], ["Season opener"])
        self.assertEqual(calls[0][1]["dates"], "20261003",
                         "ESPN's dates parameter is a bare YYYYMMDD; the dashed form is HTTP 400")

    def test_scoreboard_without_a_date_sends_no_dates_parameter(self):
        calls = []
        api = EspnClient(fetch=fetch_from({"scoreboard": NBA_BOARD, "teams": NBA_TEAMS,
                                          "standings": NBA_STANDINGS, "summary": NBA_SUMMARY}, calls))
        api.scoreboard("nba")
        self.assertNotIn("dates", calls[0][1], "no day was named, so none is forced on ESPN")

    def test_a_soccer_draw_is_read_from_the_competition(self):
        api = client(scoreboard=SOCCER_BOARD)
        game = api.scoreboard("eng1")[0]
        self.assertEqual(game["state"], "post")
        self.assertTrue(game["completed"])
        self.assertEqual(game["home"]["score"], "2")
        self.assertEqual(game["away"]["score"], "2")
        self.assertIsNone(game["odds"], "ESPN publishes no odds for this league, so none are invented")

    def test_an_unexpected_payload_is_upstream_error(self):
        from a2a_kit import UpstreamError

        api = client(scoreboard={"nope": True})
        with self.assertRaises(UpstreamError):
            api.scoreboard("nba")

    def test_odds_are_read_from_the_array_shape(self):
        game = client().scoreboard("nba", day="2026-10-03")[0]
        self.assertEqual(game["odds"]["over_under"], 218.5,
                         "the scoreboard carries odds as an array")

    def test_teams_returns_the_clubhouse(self):
        teams = client().teams("nba", limit=3)
        self.assertEqual(len(teams), 3)
        self.assertEqual(teams[0]["displayName"], "Atlanta Hawks")
        self.assertEqual(teams[0]["clubhouse"],
                         "https://www.espn.com/nba/team/_/name/atl")
        self.assertEqual(teams[2]["isActive"], False)

    def test_standings_reads_the_stat_names_per_league(self):
        table = client().standings("nba", season=2026)
        self.assertEqual(table["season"], 2026)
        self.assertEqual(table["group_count"], 1)
        group = table["groups"][0]
        self.assertEqual(group["name"], "Eastern Conference East")
        self.assertEqual(group["entries"][0]["displayName"], "Detroit Pistons")
        self.assertEqual(group["entries"][0]["stats"]["wins"], 41)
        self.assertEqual(group["entries"][0]["stats"]["games_behind"], "-")
        self.assertEqual(group["entries"][1]["stats"]["games_behind"], "11.0")

    def test_standings_with_no_season_reads_the_published_one(self):
        calls = []
        api = EspnClient(fetch=fetch_from({"standings": NBA_STANDINGS, "scoreboard": NBA_BOARD,
                                          "teams": NBA_TEAMS, "summary": NBA_SUMMARY}, calls))
        api.standings("nba")
        self.assertNotIn("season", calls[0][1])

    def test_summary_adds_venue_attendance_and_officials(self):
        game = client().summary("nba", "401902644")
        self.assertEqual(game["venue"], "Scotiabank Arena")
        self.assertEqual(game["attendance"], 19000)
        self.assertEqual(game["officials"], ["Referee One"])
        self.assertEqual(game["league"], "nba")
        self.assertEqual(game["away"]["team"], "Miami Heat")

    def test_summary_for_an_unknown_event_is_none(self):
        self.assertIsNone(client(summary={}).summary("nba", "401902644"))


class ParseTests(unittest.TestCase):
    def text(self, value):
        return parse({"parts": [{"kind": "text", "text": value}]})

    def test_scores_wording(self):
        request = self.text("what are the nba scores today?")
        self.assertEqual(request["skill"], "scores")
        self.assertEqual(request["params"]["league"], "nba")

    def test_a_named_date_is_not_read_as_a_season(self):
        request = self.text("mlb scores for 2026-09-28")
        self.assertEqual(request["params"]["date"], "2026-09-28")
        self.assertNotIn("season", request["params"])

    def test_tomorrow_and_no_date_at_all(self):
        self.assertTrue(self.text("tomorrow nhl")["params"]["tomorrow"])
        self.assertNotIn("next_day", self.text("tomorrow nhl")["params"])
        self.assertTrue(self.text("nfl")["params"]["next_day"],
                        "no day named means ESPN's own current board")

    def test_team_lookup_wording(self):
        request = self.text("look up the Toronto Raptors")
        self.assertEqual(request["skill"], "team-lookup")
        self.assertEqual(request["params"]["team"], "Toronto Raptors")
        by_abbr = self.text("which team is MIA in the nba?")
        self.assertEqual(by_abbr["skill"], "team-lookup")
        self.assertEqual(by_abbr["params"]["team"], "MIA")
        self.assertEqual(by_abbr["params"]["league"], "nba")

    def test_standings_wording_and_season(self):
        self.assertEqual(self.text("nba standings")["skill"], "standings")
        self.assertEqual(self.text("who is top of the mlb table")["skill"], "standings")
        self.assertEqual(self.text("nba standings for the 2026 season")["params"]["season"], "2026")

    def test_game_detail_wording(self):
        request = self.text("game detail for event 401902644")
        self.assertEqual(request["skill"], "game-detail")
        self.assertEqual(request["params"]["event_id"], "401902644")

    def test_slate_wording_covers_several_leagues(self):
        request = self.text("what is on tonight across the leagues?")
        self.assertEqual(request["skill"], SKILL_SLATE_BRIEF)
        self.assertEqual(request["params"]["leagues"], "nba,nfl,nhl,mlb")
        named = self.text("brief me on every nba, nfl and nhl game tomorrow")
        self.assertEqual(named["params"]["leagues"], "nba,nfl,nhl")

    def test_a_bare_event_id_is_read(self):
        request = self.text("401891773")
        self.assertEqual(request["skill"], "game-detail")
        self.assertEqual(request["params"]["event_id"], "401891773")

    def test_a_bare_date_is_not_read_as_an_event_id(self):
        request = self.text("20260928")
        self.assertNotEqual(request["params"].get("event_id"), "20260928")

    def test_a_game_detail_without_an_id_still_belongs_to_the_detail_skill(self):
        request = self.text("tell me about that game in detail")
        self.assertEqual(request["skill"], "game-detail")
        self.assertNotIn("event_id", request["params"])

    def test_help_and_empty(self):
        self.assertEqual(self.text("")["skill"], "help")
        self.assertEqual(self.text("what can you do?")["skill"], "help")

    def test_explicit_json_wins(self):
        request = parse({"parts": [{"kind": "data", "data": {
            "skill": "scores", "league": "nhl", "date": "2026-10-01", "limit": 5}}]})
        self.assertEqual(request["skill"], "scores")
        self.assertEqual(request["params"]["league"], "nhl")
        self.assertTrue(request["explicit"])

    def test_league_and_team_helpers(self):
        self.assertEqual(leagues_from_text("nba and nhl tonight"), ["nba", "nhl"])
        self.assertEqual(leagues_from_text("nothing here"), [])
        self.assertEqual(team_from_text("look up the Toronto Raptors", None), "Toronto Raptors")
        self.assertIsNone(team_from_text("look up the Toronto Raptors", "Raptors"))


class SkillTests(unittest.TestCase):







    def test_team_lookup_without_a_team_asks(self):
        agent = EspnAgent(client=client())
        self.assertEqual(agent.missing("team-lookup", {}), ["team"])
        result = agent.run({"skill": "team-lookup", "params": {}, "missing": ["team"]})
        self.assertIn("Which team?", result["message"])








    def test_game_detail_without_an_event_asks(self):
        agent = EspnAgent(client=client())
        self.assertEqual(agent.missing("game-detail", {}), ["event_id"])
        result = agent.run({"skill": "game-detail", "params": {}, "missing": ["event_id"]})
        self.assertIn("ESPN event id", result["message"])





#: Shape copied from a live `sports_slate_brief` answer for 2026-09-28.
SLATE_PAYLOAD = {
    "date": "2026-09-28",
    "leagues": ["nba", "nfl", "nhl", "mlb"],
    "leaguesRead": ["nba", "nfl", "nhl", "mlb"],
    "perLeague": [
        {"league": "nba", "games": 0, "read": True},
        {"league": "nfl", "games": 14, "read": True},
        {"league": "nhl", "games": 5, "read": True},
        {"league": "mlb", "games": 0, "read": True},
    ],
    "errors": [],
    "gamesFound": 19,
    "gamesListed": 2,
    "truncated": True,
    "byState": {"post": 17, "pre": 2},
    "liveNow": 0,
    "finals": 17,
    "stillToCome": 2,
    "games": [
        {"league": "nfl", "eventId": "401671800", "name": "Panthers at Falcons",
         "shortName": "CAR @ ATL", "date": "2026-09-20T00:20Z", "state": "post", "completed": True,
         "detail": "Final", "shortDetail": "Final", "period": 4, "clock": None,
         "away": {"team": "Carolina Panthers", "abbreviation": "CAR", "score": 3,
                  "records": ["1-1"], "winner": False},
         "home": {"team": "Atlanta Falcons", "abbreviation": "ATL", "score": 27,
                  "records": ["1-1"], "winner": True},
         "venue": "Mercedes-Benz Stadium", "broadcast": "FOX",
         "odds": {"details": "CAR -2.5", "overUnder": 45.5, "spread": -2.5}, "notes": []},
        {"league": "nhl", "eventId": "400459000", "name": "Panthers at Hurricanes",
         "shortName": "FLA @ CAR", "date": "2026-09-29T21:00Z", "state": "pre",
         "completed": False, "detail": "Tue, September 29th at 5:00 PM EDT", "period": 0,
         "clock": "0.0",
         "away": {"team": "Florida Panthers", "abbreviation": "FLA", "score": 0,
                  "records": [], "winner": None},
         "home": {"team": "Carolina Hurricanes", "abbreviation": "CAR", "score": 0,
                  "records": [], "winner": None},
         "venue": None, "broadcast": None, "odds": None, "notes": []},
    ],
}

TOOL_ERROR_TEXT = "`sports_slate_brief` failed: upstream returned HTTP 503"


def _message(text, **extra):
    payload = {"kind": "message", "role": "user", "messageId": "test-message",
               "parts": [{"kind": "text", "text": text}]}
    payload.update(extra)
    return payload




class SlateBriefTests(unittest.TestCase):
    """The premium skill: parsing stays local, the cross-league tally comes from the gateway."""


    def test_the_free_skills_keep_their_own_questions(self):
        self.assertEqual(parse(_message("what are the nba scores today?"))["skill"], "scores")
        self.assertEqual(parse(_message("look up the Toronto Raptors"))["skill"], "team-lookup")
        self.assertEqual(parse(_message("nba standings"))["skill"], "standings")
        self.assertEqual(parse(_message("game detail for event 401902644"))["skill"], "game-detail")

    def test_an_explicit_skill_id_is_honoured(self):
        parsed = parse(_message("anything at all", parts=[
            {"kind": "data", "data": {"skill": SKILL_SLATE_BRIEF, "date": "2026-09-28",
                                      "leagues": "nba,nfl", "limit": 40}}]))
        self.assertEqual(parsed["skill"], SKILL_SLATE_BRIEF)
        self.assertEqual(parsed["params"]["leagues"], "nba,nfl")
        self.assertEqual(parsed["params"]["limit"], 40)











if __name__ == "__main__":
    unittest.main()
