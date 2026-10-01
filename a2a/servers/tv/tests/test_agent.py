"""Tests for the TVMaze server.

    python3 servers/tv/tests/test_agent.py
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

from a2a_kit import GatewayClient  # noqa: E402

from agent import (  # noqa: E402
    CARD_SKILLS,
    SKILL_BINGE_PLAN,
    TvMazeAgent,
    parse,
    show_from_text,
)
from data import (  # noqa: E402
    DATASET,
    EPISODES_PATH,
    SEARCH_PATH,
    SINGLESEARCH_PATH,
    TvmazeClient,
    day_for_name,
    plain_text,
)

SEARCH_PAYLOAD = [
    {
        "score": 0.8896408,
        "show": {
            "id": 44933,
            "name": "Severance",
            "type": "Scripted",
            "language": "English",
            "status": "Running",
            "premiered": "2022-02-18",
            "ended": None,
            "averageRuntime": 49,
            "genres": ["Drama", "Science-Fiction", "Mystery"],
            "schedule": {"time": "", "days": ["Friday"]},
            "rating": {"average": 7.7},
            "network": None,
            "webChannel": {"id": 310, "name": "Apple TV"},
            "officialSite": "https://tv.apple.com/show/severance",
            "externals": {"imdb": "tt11280740"},
            "summary": "<p>Mark Scout leads a team at Lumon Industries.</p>",
            "updated": 1790620020,
        },
    },
    {
        "score": 0.42,
        "show": {
            "id": 9999,
            "name": "Severance: Behind the Scenes",
            "type": "Documentary",
            "language": "English",
            "status": "Ended",
            "premiered": "2022-03-01",
            "ended": "2022-04-01",
            "genres": ["Documentary"],
            "schedule": {"time": "", "days": []},
            "rating": {"average": None},
            "network": {"id": 5, "name": "HBO"},
            "webChannel": None,
            "summary": None,
        },
    },
]

SHOW_PAYLOAD = {
    "id": 44933,
    "name": "Severance",
    "type": "Scripted",
    "language": "English",
    "status": "Running",
    "premiered": "2022-02-18",
    "ended": None,
    "averageRuntime": 49,
    "genres": ["Drama", "Science-Fiction", "Mystery"],
    "schedule": {"time": "", "days": ["Friday"]},
    "rating": {"average": 7.7},
    "network": None,
    "webChannel": {"id": 310, "name": "Apple TV"},
    "officialSite": None,
    "externals": {"imdb": "tt11280740"},
    "summary": "<p>Mark Scout leads a team at <b>Lumon</b> Industries.</p>",
}

EPISODE_PAYLOAD = [
    {
        "id": 2939710,
        "name": "Cold Harbor",
        "season": 2,
        "number": 10,
        "type": "regular",
        "airdate": "2025-03-21",
        "airtime": "",
        "airstamp": "2025-03-21T12:00:00+00:00",
        "runtime": 75,
        "rating": {"average": 8.2},
        "image": None,
        "summary": "<p>Season finale.</p>",
        "_links": {"self": {"href": "https://api.tvmaze.com/episodes/2939710"}},
    },
    {
        "id": 2939001,
        "name": "Good News About Hell",
        "season": 1,
        "number": 2,
        "type": "regular",
        "airdate": "2022-02-25",
        "airtime": "",
        "airstamp": "2022-02-25T04:00:00+00:00",
        "runtime": 48,
        "rating": {"average": 7.9},
        "summary": None,
    },
]

SCHEDULE_PAYLOAD = [
    {
        "id": 3718466,
        "name": "Episode 188",
        "season": 2026,
        "number": 188,
        "type": "regular",
        "airdate": "2026-09-28",
        "airtime": "05:00",
        "airstamp": "2026-09-28T09:00:00+00:00",
        "runtime": 60,
        "rating": {"average": None},
        "image": None,
        "summary": "<p>Headlines.</p>",
        "show": {
            "id": 15308,
            "name": "Way Too Early",
            "type": "News",
            "language": "English",
            "status": "Running",
            "network": {"id": 201, "name": "MS NOW"},
            "webChannel": None,
            "schedule": {"time": "05:00", "days": ["Monday"]},
            "rating": {"average": None},
        },
    }
]


def _no_network(*args, **kwargs):
    raise AssertionError("FakeTvmaze must not touch the network")


def fetch_from(payloads, calls=None):
    """A JsonApiClient `fetch` that dispatches on path, so data.py runs for real."""

    def fetch(url, params, headers):
        if calls is not None:
            calls.append((url, dict(params)))
        if url.endswith(SEARCH_PATH):
            return payloads["search"]
        if url.endswith(SINGLESEARCH_PATH):
            return payloads["show"]
        if "/episodes" in url:
            return payloads["episodes"]
        if "/shows/" in url:
            return payloads["show"]
        if "/schedule" in url:
            return payloads["schedule"]
        raise AssertionError(f"unexpected url {url}")

    return fetch


def client(**payloads):
    base = {"search": [], "show": SHOW_PAYLOAD, "episodes": [], "schedule": []}
    base.update(payloads)
    return TvmazeClient(fetch=fetch_from(base))


def live_client(calls):
    return TvmazeClient(fetch=fetch_from(
        {"search": SEARCH_PAYLOAD, "show": SHOW_PAYLOAD,
         "episodes": EPISODE_PAYLOAD, "schedule": SCHEDULE_PAYLOAD}, calls))


class ValidationTests(unittest.TestCase):
    def test_check_show_id(self):
        self.assertEqual(TvmazeClient.check_show_id(" 44933 "), 44933)
        for bad in ("abc", "", "44933x"):
            with self.assertRaises(ValueError):
                TvmazeClient.check_show_id(bad)

    def test_check_name_limit_season_episode(self):
        self.assertEqual(TvmazeClient.check_name(" Severance "), "Severance")
        with self.assertRaises(ValueError):
            TvmazeClient.check_name("!!")
        self.assertEqual(TvmazeClient.check_limit("5"), 5)
        with self.assertRaises(ValueError):
            TvmazeClient.check_limit("0")
        self.assertEqual(TvmazeClient.check_season("2"), 2)
        with self.assertRaises(ValueError):
            TvmazeClient.check_season("0")
        self.assertEqual(TvmazeClient.check_episode("0"), 0)
        with self.assertRaises(ValueError):
            TvmazeClient.check_episode(-1)

    def test_check_date_and_country(self):
        self.assertEqual(TvmazeClient.check_date("2026-09-28"), "2026-09-28")
        with self.assertRaises(ValueError):
            TvmazeClient.check_date("28-09-2026")
        with self.assertRaises(ValueError):
            TvmazeClient.check_date("2026-02-31")
        self.assertEqual(TvmazeClient.check_country("us"), "US")
        with self.assertRaises(ValueError):
            TvmazeClient.check_country("USA")

    def test_plain_text_strips_html(self):
        self.assertEqual(plain_text("<p>Mark <b>Scout</b> leads.</p>"), "Mark Scout leads.")
        self.assertIsNone(plain_text(None))
        self.assertIsNone(plain_text("<p></p>"))

    def test_day_for_name(self):
        from datetime import date

        self.assertIsNone(day_for_name("someday"))
        day = day_for_name("monday")
        self.assertRegex(day, r"^\d{4}-\d{2}-\d{2}$")
        self.assertGreaterEqual(date.fromisoformat(day), date.today())


class ReaderTests(unittest.TestCase):
    def test_search_shows_maps_score_and_summary(self):
        calls = []
        api = live_client(calls)
        found = api.search_shows("severance", limit=5)
        self.assertEqual(len(found), 2)
        self.assertEqual(found[0]["name"], "Severance")
        self.assertAlmostEqual(found[0]["match_score"], 0.8896408, places=6)
        self.assertEqual(found[0]["station"], "Apple TV")
        self.assertEqual(found[0]["summary"], "Mark Scout leads a team at Lumon Industries.")
        self.assertEqual(calls[0][0].split("?")[0].endswith(SEARCH_PATH), True)
        self.assertEqual(calls[0][1], {"q": "severance"})

    def test_search_with_no_match_is_an_empty_list(self):
        self.assertEqual(client().search_shows("zzzz"), [])

    def test_show_by_id_and_by_name(self):
        calls = []
        api = live_client(calls)
        by_id = api.show("44933")
        self.assertEqual(by_id["name"], "Severance")
        self.assertEqual(by_id["schedule_days"], "Friday")
        self.assertEqual(by_id["rating"], 7.7)
        by_name = api.show("Severance")
        self.assertEqual(by_name["id"], 44933)
        self.assertTrue(any("/singlesearch/shows" in url for url, _ in calls))

    def test_show_requires_an_identifier(self):
        with self.assertRaises(ValueError):
            client().show("")

    def test_episodes_are_sorted_and_labelled(self):
        api = live_client([])
        episodes = api.episodes("44933")
        self.assertEqual([ep["season"] for ep in episodes], [1, 2])
        self.assertEqual(episodes[0]["label"], "S01E02")
        self.assertEqual(episodes[1]["label"], "S02E10")
        self.assertEqual(episodes[1]["summary"], "Season finale.")

    def test_next_episode_skips_past_airstamps(self):
        api = live_client([])
        # Every fixture episode aired in the past, so there is no next one.
        self.assertIsNone(api.next_episode("44933"))

    def test_next_episode_takes_the_first_future_airstamp(self):
        from datetime import datetime, timedelta, timezone

        future = (datetime.now(timezone.utc) + timedelta(days=3)).strftime("%Y-%m-%dT%H:%M:%S+00:00")
        rows = [dict(EPISODE_PAYLOAD[0]), {**EPISODE_PAYLOAD[1], "season": 3, "number": 1,
                                          "name": "The Fresh Start", "airstamp": future}]
        api = client(episodes=rows)
        upcoming = api.next_episode("44933")
        self.assertEqual(upcoming["name"], "The Fresh Start")
        self.assertEqual(upcoming["season"], 3)

    def test_schedule_reads_a_day_and_a_country(self):
        calls = []
        api = live_client(calls)
        rows = api.schedule("2026-09-28", "us", limit=5)
        self.assertEqual(rows[0]["show_name"], "Way Too Early")
        self.assertEqual(rows[0]["station"], "MS NOW")
        self.assertEqual(rows[0]["label"], "S2026E188")
        self.assertEqual(calls[0][1], {"date": "2026-09-28", "country": "US"})

    def test_schedule_defaults_to_today(self):
        calls = []
        api = live_client(calls)
        api.schedule()
        self.assertRegex(calls[0][1]["date"], r"^\d{4}-\d{2}-\d{2}$")


class ParseTests(unittest.TestCase):
    def text(self, value):
        return parse({"parts": [{"kind": "text", "text": value}]})

    def test_search_is_the_default(self):
        self.assertEqual(self.text("severance")["skill"], "show-search")
        self.assertEqual(self.text("what shows are there called Severance?")["skill"], "show-search")

    def test_episodes_and_season(self):
        request = self.text("list the episodes of Severance season 2")
        self.assertEqual(request["skill"], "show-episodes")
        self.assertEqual(request["params"]["show"], "Severance")
        self.assertEqual(request["params"]["season"], "2")

    def test_next_airing(self):
        request = self.text("when does Severance air next?")
        self.assertEqual(request["skill"], "next-airing")
        self.assertEqual(request["params"]["show"], "Severance")

    def test_schedule_today_and_weekday(self):
        self.assertEqual(self.text("what is on tv tonight?")["skill"], "schedule-day")
        self.assertEqual(self.text("what's on tv in the US on monday?")["params"]["date"],
                         day_for_name("monday"))
        self.assertEqual(self.text("what's on tv in the US on monday?")["params"]["country"], "US")

    def test_tomorrow_is_flagged_not_guessed(self):
        request = self.text("what's on tv tomorrow?")
        self.assertTrue(request["params"]["tomorrow"])
        self.assertNotIn("date", request["params"])

    def test_show_id_in_text(self):
        request = self.text("show 44933 episodes")
        self.assertEqual(request["params"]["show_id"], "44933")

    def test_help_and_empty(self):
        self.assertEqual(self.text("")["skill"], "help")
        self.assertEqual(self.text("what can you do?")["skill"], "help")

    def test_explicit_json_wins(self):
        request = parse({"parts": [{"kind": "data", "data": {
            "skill": "show-episodes", "show": "The Wire", "season": 3}}]})
        self.assertEqual(request["skill"], "show-episodes")
        self.assertEqual(request["params"]["season"], 3)
        self.assertTrue(request["explicit"])

    def test_title_extraction_keeps_articles_and_drops_question_words(self):
        self.assertEqual(show_from_text("episode guide for The Wire", None), "The Wire")
        self.assertEqual(show_from_text("search for severance", None), "severance")
        self.assertIsNone(show_from_text("what is on tv tonight?", None))
        self.assertIsNone(show_from_text("episodes of Severance", "Severance"))


class SkillTests(unittest.TestCase):
    def run_skill(self, skill, api=None, gateway=None, **params):
        agent = TvMazeAgent(client=api or client(), gateway=gateway or GatewayClient(fetch=_no_network))
        request = {"skill": skill, "params": params, "missing": agent.missing(skill, params)}
        return agent.run(request)

    def test_search_cites_the_dataset_and_scores(self):
        result = self.run_skill("show-search", api=live_client([]), show="severance")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn(DATASET, result["message"])
        self.assertIn("Severance", result["message"])
        self.assertIn("match 0.89", result["message"])
        self.assertEqual(result["artifact"]["count"], 2)
        self.assertEqual(result["artifact"]["shows"][0]["id"], 44933)

    def test_search_with_no_match_says_so(self):
        result = self.run_skill("show-search", show="zzzznotashow")
        self.assertIn("TVMaze matches no show", result["message"])
        self.assertEqual(result["artifact"]["count"], 0)

    def test_search_without_a_query_asks(self):
        result = self.run_skill("show-search")
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("What show", result["message"])

    def test_episodes_list_a_season(self):
        result = self.run_skill("show-episodes", api=live_client([]), show="Severance", season=2)
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("S02E10", result["message"])
        self.assertIn("Cold Harbor", result["message"])
        self.assertIn("75 min", result["message"])
        self.assertEqual(result["artifact"]["count"], 1)
        self.assertEqual(result["artifact"]["show"]["id"], 44933)

    def test_episodes_for_an_empty_season(self):
        result = self.run_skill("show-episodes", api=live_client([]), show="Severance", season=9)
        self.assertIn("no episodes for season 9", result["message"])

    def test_next_airing_when_one_is_scheduled(self):
        from datetime import datetime, timedelta, timezone

        future = (datetime.now(timezone.utc) + timedelta(days=2)).strftime("%Y-%m-%dT%H:%M:%S+00:00")
        rows = [{**EPISODE_PAYLOAD[1], "season": 3, "number": 1, "name": "The Fresh Start",
                 "airdate": future[:10], "airstamp": future}]
        result = self.run_skill("next-airing", api=client(episodes=rows), show="Severance")
        self.assertIn("airs next", result["message"])
        self.assertIn("The Fresh Start", result["message"])
        self.assertEqual(result["artifact"]["next_episode"]["season"], 3)

    def test_next_airing_when_nothing_is_scheduled(self):
        result = self.run_skill("next-airing", api=live_client([]), show="Severance")
        self.assertIn("no future episode scheduled", result["message"])
        self.assertIn("Running", result["message"])
        self.assertIsNone(result["artifact"]["next_episode"])

    def test_schedule_lists_a_day(self):
        result = self.run_skill("schedule-day", api=live_client([]), date="2026-09-28")
        self.assertIn("Way Too Early", result["message"])
        self.assertIn("MS NOW", result["message"])
        self.assertIn("2026-09-28", result["message"])
        self.assertEqual(result["artifact"]["count"], 1)

    def test_schedule_on_an_empty_day(self):
        result = self.run_skill("schedule-day", api=client(schedule=[]), date="2026-09-28")
        self.assertIn("schedules no episodes", result["message"])

    def test_schedule_tomorrow_resolves_to_a_date(self):
        result = self.run_skill("schedule-day", api=client(schedule=[]), tomorrow=True)
        self.assertNotEqual(result["artifact"]["date"], "today (UTC)")

    def test_a_missing_show_is_reported_not_guessed(self):
        agent = TvMazeAgent(client=client(), gateway=GatewayClient(fetch=_no_network))
        self.assertEqual(agent.missing("show-episodes", {}), ["show"])
        result = agent.run({"skill": "show-episodes", "params": {}, "missing": ["show"]})
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("TVMaze show id", result["message"])

    def test_an_unknown_show_is_a_completed_answer(self):
        from a2a_kit import UpstreamError

        def refuse(url, params, headers):
            raise UpstreamError("TVMAZE request failed: HTTP Error 404")

        api = TvmazeClient(fetch=refuse)
        result = self.run_skill("show-episodes", api=api, show="Atlantis Prime")
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("TVMaze has no show matching", result["message"])

    def test_help_does_not_touch_the_feed(self):
        result = self.run_skill("help")
        self.assertIn("TVMaze", result["message"])
        self.assertIsNone(result["artifact"])

    def test_the_prefixed_gateway_url_override_is_wired_up(self):
        import os

        os.environ["TVMAZE_GATEWAY_URL"] = "http://127.0.0.1:9/mcp"
        try:
            agent = TvMazeAgent(client=client())
        finally:
            del os.environ["TVMAZE_GATEWAY_URL"]
        self.assertEqual(agent.gateway.url, "http://127.0.0.1:9/mcp",
                         "the .env.example documents this override, so it has to work")

    def test_card_skills_and_env_prefix(self):
        ids = [skill["id"] for skill in CARD_SKILLS]
        self.assertEqual(ids, ["show-search", "show-episodes", "next-airing", "schedule-day",
                               "binge-plan"])
        self.assertIn("premium", [tag for skill in CARD_SKILLS if skill["id"] == "binge-plan"
                                  for tag in skill["tags"]])
        agent = TvMazeAgent(client=client())
        self.assertEqual(agent.env_prefix, "TVMAZE")


#: Shape copied from a live `tv_binge_plan` answer for Severance season 2.
BINGE_PAYLOAD = {
    "show": "Severance",
    "showId": 44933,
    "season": 2,
    "status": "Running",
    "network": "Apple TV",
    "averageRuntime": 49,
    "scheduleDay": "Friday",
    "scheduleTime": "",
    "episodesLeft": 2,
    "episodeCount": 10,
    "minutesKnown": 2,
    "minutesUnknown": 0,
    "totalMinutes": 140,
    "totalHours": 2.3,
    "episodesPerDay": 2,
    "daysNeeded": 1,
    "fromEpisode": 9,
    "firstAirdate": "2026-09-25",
    "lastAirdate": "2026-10-02",
    "seasonFinaleAirstamp": "2026-10-02T04:00:00+00:00",
    "finishDate": "2026-09-25",
    "episodes": [
        {"number": 9, "name": "We Are Here", "airdate": "2026-09-25", "airtime": "",
         "runtime": 68, "rating": 8.4},
        {"number": 10, "name": "Cold Harbor", "airdate": "2026-10-02", "airtime": "",
         "runtime": 72, "rating": 8.6},
    ],
    "note": None,
}

DENIED_TEXT = ("`tv_binge_plan` is a premium tool, but that license key is not valid. "
               "Get a key at https://buy.polar.sh/polar_cl_example")
TOOL_ERROR_TEXT = "`tv_binge_plan` failed: TVMaze returned HTTP 404"


def _message(text, **extra):
    payload = {"kind": "message", "role": "user", "messageId": "test-message",
               "parts": [{"kind": "text", "text": text}]}
    payload.update(extra)
    return payload


def fake_gateway(payload=None, error=None, text=None, tool_error=None, key="polar_test_key"):
    """A GatewayClient whose HTTP POST is a function, so no test touches the network."""
    calls: list[dict] = []

    def fetch(url, request_payload, headers):
        calls.append({"url": url, "payload": request_payload, "headers": headers})
        if error is not None:
            raise error
        if tool_error is not None:
            # Failed after the gate let it through: no licenceRefusal marker.
            return {"jsonrpc": "2.0", "id": 1,
                    "result": {"content": [{"type": "text", "text": tool_error}], "isError": True}}
        if payload is None and text is None:
            # The gateway's licence refusal, marker included: the marker is what tells a
            # refusal apart from a tool that failed after the gate had let it through.
            return {"jsonrpc": "2.0", "id": 1,
                    "result": {"content": [{"type": "text", "text": DENIED_TEXT}],
                               "structuredContent": {"licenceRefusal": True, "reason": "invalid"},
                               "isError": True}}
        body = text if text is not None else json.dumps(payload)
        return {"jsonrpc": "2.0", "id": 1, "result": {"content": [{"type": "text", "text": body}]}}

    return GatewayClient(fetch=fetch, key=key), calls


class BingePlanTests(unittest.TestCase):
    """The premium skill: parsing stays local, the plan comes from the gateway."""

    def test_finish_the_season_routes_to_the_premium_skill(self):
        for text in ("how long do I need to finish season 2 of Severance?",
                     "binge Severance season 2, two episodes a night",
                     "I am on episode 3 of Severance season 2, two episodes a night",
                     "catch up on Succession"):
            parsed = parse(_message(text))
            self.assertEqual(parsed["skill"], SKILL_BINGE_PLAN, text)
            self.assertTrue(parsed["explicit"], text)

    def test_the_free_skills_keep_their_own_questions(self):
        self.assertEqual(parse(_message("search for severance"))["skill"], "show-search")
        self.assertEqual(parse(_message("list the episodes of Severance"))["skill"], "show-episodes")
        self.assertEqual(parse(_message("when does Severance air next?"))["skill"], "next-airing")
        self.assertEqual(parse(_message("what is on tv tonight?"))["skill"], "schedule-day")

    def test_an_explicit_skill_id_is_honoured(self):
        parsed = parse(_message("anything at all", parts=[
            {"kind": "data", "data": {"skill": SKILL_BINGE_PLAN, "show": "Severance",
                                      "season": 2, "from_episode": 3, "episodes_per_day": 2}}]))
        self.assertEqual(parsed["skill"], SKILL_BINGE_PLAN)
        self.assertEqual(parsed["params"]["from_episode"], 3)
        self.assertEqual(parsed["params"]["episodes_per_day"], 2)

    def test_the_message_reports_the_gateways_plan(self):
        gateway, calls = fake_gateway(BINGE_PAYLOAD)
        result = TvMazeAgent(client(), gateway=gateway).run(
            {"skill": SKILL_BINGE_PLAN, "params": {"show": "Severance", "season": 2}, "missing": []})
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("2 episode(s) left", result["message"])
        self.assertIn("2.3 h of screen time", result["message"])
        self.assertIn("Cold Harbor", result["message"])
        self.assertIn("finish around 2026-09-25", result["message"])
        self.assertIn(DATASET, result["message"])
        self.assertTrue(result["artifact"]["premium"])
        self.assertEqual(result["artifact"]["episodes_left"], 2)

        # TVMaze's episode list was read behind the gate, not here.
        self.assertEqual(len(calls), 1)
        sent = calls[0]["payload"]["params"]
        self.assertEqual(sent["name"], "tv_binge_plan")
        self.assertEqual(sent["arguments"]["show"], "Severance")
        self.assertEqual(sent["arguments"]["season"], 2)
        self.assertNotIn("from_episode", sent["arguments"], "nothing asked for, so nothing is sent")

    def test_a_watch_rate_is_validated_before_the_gateway(self):
        gateway, calls = fake_gateway(BINGE_PAYLOAD)
        result = TvMazeAgent(client(), gateway=gateway).run(
            {"skill": SKILL_BINGE_PLAN,
             "params": {"show": "Severance", "episodes_per_day": "90"}, "missing": []})
        self.assertEqual(result["final_state"], "input-required")
        self.assertEqual(calls, [], "a bad argument never reaches the gateway")

    def test_without_a_licence_the_caller_is_told_how_to_get_one(self):
        gateway, calls = fake_gateway(key="")
        result = TvMazeAgent(client(), gateway=gateway).run(
            {"skill": SKILL_BINGE_PLAN, "params": {"show": "Severance"}, "missing": []})
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("MCP_LICENSE_KEY", result["message"])
        self.assertEqual(result["artifact"]["reason"], "missing_key")
        self.assertEqual(calls, [], "a keyless caller must not reach the gateway")

    def test_a_licence_refusal_keeps_the_gateways_wording(self):
        gateway, _ = fake_gateway()  # nothing but a refusal
        result = TvMazeAgent(client(), gateway=gateway).run(
            {"skill": SKILL_BINGE_PLAN, "params": {"show": "Severance"}, "missing": []})
        self.assertEqual(result["final_state"], "completed")
        self.assertEqual(result["message"], DENIED_TEXT)
        self.assertEqual(result["artifact"]["reason"], "denied")

    def test_a_dead_gateway_fails_instead_of_inventing_a_plan(self):
        gateway, _ = fake_gateway(error=OSError("connection refused"))
        result = TvMazeAgent(client(), gateway=gateway).run(
            {"skill": SKILL_BINGE_PLAN, "params": {"show": "Severance"}, "missing": []})
        self.assertEqual(result["final_state"], "failed")
        self.assertIn("could not be reached", result["message"])
        self.assertIsNone(result["artifact"].get("episodes"))

    def test_a_tool_error_is_not_sold_as_a_licence_problem(self):
        gateway, _ = fake_gateway(tool_error=TOOL_ERROR_TEXT)
        result = TvMazeAgent(client(), gateway=gateway).run(
            {"skill": SKILL_BINGE_PLAN, "params": {"show": "Severance"}, "missing": []})
        self.assertEqual(result["final_state"], "failed")
        self.assertNotIn("MCP_LICENSE_KEY", result["message"])
        self.assertIn("TVMaze returned HTTP 404", result["message"])

    def test_an_already_finished_season_reports_cleanly(self):
        payload = {**BINGE_PAYLOAD, "episodesLeft": 0, "episodes": [], "totalMinutes": 0,
                   "verdict": "Season 2 of Severance is already finished as far as episode 10."}
        gateway, _ = fake_gateway(payload)
        result = TvMazeAgent(client(), gateway=gateway).run(
            {"skill": SKILL_BINGE_PLAN, "params": {"show": "Severance", "from_episode": 10},
             "missing": []})
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("already finished", result["message"])
        self.assertEqual(result["artifact"]["episodes_left"], 0)


if __name__ == "__main__":
    unittest.main()
