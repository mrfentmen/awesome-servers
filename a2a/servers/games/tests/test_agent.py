"""Tests for the games A2A server.

    python3 servers/games/tests/test_agent.py

The games reader is the real one: only the HTTP fetch is a function, so the price cents
handling, the owner-range honesty rule, the playtime "0 means no sample" rule and the Epic
window split are all exercised for real.
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

from a2a_kit import UpstreamError

from agent import (  # noqa: E402
    PREMIUM_TOOL,
    SKILLS,
    SKILL_BOARD,
    SKILL_FREE,
    SKILL_HELP,
    SKILL_NEWS,
    SKILL_SEARCH,
    SKILL_STATS,
    GamesAgent,
    day,
    games_from_data,
    name_from_text,
    names_from_compare,
    parse,
    route,
    run_board,
    run_free,
    run_help,
    run_news,
    run_search,
    run_stats,
    usd,
)
from data import (  # noqa: E402
    DATASET_EPIC,
    DATASET_STEAM,
    DATASET_STEAMSPY,
    GamesClient,
    cents,
    review_ratio,
)

#: Steam's storesearch as it answered on 2026-09-30: integer cents, a metascore, a free-to-play
#: title with no price object at all.
SEARCH_PAYLOAD = {
    "total": 3,
    "items": [
        {"id": 620, "name": "Portal 2", "type": "game", "metascore": 95,
         "price": {"final": 999, "initial": 1999, "currency": "USD"},
         "tiny_image": "https://cdn.example/portal2.jpg"},
        {"id": 400, "name": "Portal", "type": "game", "metascore": 90,
         "price": {"final": 499, "initial": 999, "currency": "USD"},
         "tiny_image": "https://cdn.example/portal.jpg"},
        {"id": 730, "name": "Counter-Strike 2", "type": "game",
         "tiny_image": "https://cdn.example/cs2.jpg"},
    ],
}
APP_PAYLOAD = {
    "620": {
        "success": True,
        "data": {
            "name": "Portal 2", "type": "game", "is_free": False,
            "price_overview": {"final": 999, "initial": 1999, "discount_percent": 50,
                               "currency": "USD"},
            "release_date": {"date": "Apr 18, 2011"},
            "developers": ["Valve"], "publishers": ["Valve"],
            "genres": [{"description": "Adventure"}, {"description": "Puzzle"}],
            "categories": [{"description": "Single-player"}],
            "short_description": "Now with a two-player co-op campaign.",
            "header_image": "https://cdn.example/portal2-header.jpg",
        },
    },
}
NEWS_PAYLOAD = {
    "appnews": {
        "appid": 413150,
        "newsitems": [
            {"title": "Stardew Valley 1.6.9 released", "date": 1710000000,
             "feedlabel": "Steam News", "url": "https://store.example/news/1",
             "contents": "Fixes and tweaks."},
            {"title": "Hotfix for 1.6.9", "date": 1709900000,
             "feedlabel": "Steam News", "url": "https://store.example/news/2",
             "contents": "A quick fix."},
        ],
    },
}
SPY_PAYLOAD = {
    "name": "Rust", "developer": "Facepunch Studios", "publisher": "Facepunch Studios",
    "owners": "15,000,000 .. 30,000,000", "ccu": 97509,
    "positive": 400000, "negative": 100000,
    # SteamSpy reports 0 when it has no sample; that is not "zero minutes".
    "average_forever": "0", "median_forever": "1200",
    "tags": {"Survival": 2260, "PvP": 900, "Open World": 700},
}
EPIC_PAYLOAD = {
    "data": {"Catalog": {"searchStore": {"elements": [
        {
            "title": "Ghostrunner", "id": "abc",
            "promotions": {"promotionalOffers": [{"promotionalOffers": [
                {"startDate": "2026-09-24T15:00:00.000Z",
                 "endDate": "2026-10-01T15:00:00.000Z"}]}]},
            "price": {"totalPrice": {"originalPrice": 2999, "discountPrice": 0,
                                     "currencyCode": "USD"}},
            "catalogNs": {"mappings": [{"pageSlug": "ghostrunner"}]},
            "keyImages": [{"type": "OfferImageTall", "url": "https://cdn.example/ghost.jpg"}],
        },
        {
            "title": "Suicide Squad", "id": "def",
            "promotions": {"upcomingPromotionalOffers": [{"promotionalOffers": [
                {"startDate": "2026-10-01T15:00:00.000Z",
                 "endDate": "2026-10-08T15:00:00.000Z"}]}]},
            "price": {"totalPrice": {"originalPrice": 6999, "discountPrice": 0,
                                     "currencyCode": "USD"}},
            "catalogNs": {"mappings": [{"pageSlug": "suicide-squad"}]},
            "keyImages": [],
        },
        {
            "title": "Some Paid Game", "id": "ghi",
            "promotions": {"promotionalOffers": [{"promotionalOffers": [
                {"startDate": "2026-09-24T15:00:00.000Z",
                 "endDate": "2026-10-01T15:00:00.000Z"}]}]},
            "price": {"totalPrice": {"originalPrice": 1999, "discountPrice": 999,
                                     "currencyCode": "USD"}},
            "catalogNs": {"mappings": []},
            "keyImages": [],
        },
    ]}}},
}


def games_fetch(fail: str | None = None):
    """A fetch(url, params, headers) over canned live-shaped payloads. No network."""
    calls: list[dict] = []

    def fetch(url: str, params: dict, headers: dict):
        calls.append({"url": url, "params": dict(params)})
        if fail and fail in url:
            raise UpstreamError("the feed is down")
        if "storesearch" in url:
            return SEARCH_PAYLOAD
        if "appdetails" in url:
            return APP_PAYLOAD
        if "ISteamNews" in url:
            return NEWS_PAYLOAD
        if "steamspy" in url:
            return SPY_PAYLOAD
        if "epicgames" in url:
            return EPIC_PAYLOAD
        raise UpstreamError(f"unexpected url {url}")

    return fetch, calls


def client(**kwargs) -> GamesClient:
    fetch, calls = games_fetch(**kwargs)
    return GamesClient(fetch=fetch, cache_ttl=0, timeout=5), calls


BOARD_PAYLOAD = {
    "games": [
        {"query": "elden ring", "name": "ELDEN RING", "price": 59.99,
         "owners": "10,000,000 .. 20,000,000", "ccu": 35000, "reviewRatio": 0.92},
        {"query": "dark souls 3", "name": "DARK SOULS III", "price": 39.99,
         "owners": "5,000,000 .. 10,000,000", "ccu": 12000, "reviewRatio": 0.94},
    ],
    "scanned": None,
    "cheapest": {"name": "DARK SOULS III", "price": 39.99},
    "dearest": {"name": "ELDEN RING", "price": 59.99},
    "mostPlayed": {"name": "ELDEN RING", "ccu": 35000},
    "bestReviewed": {"name": "DARK SOULS III", "reviewRatio": 0.94},
}
TOOL_ERROR_TEXT = "`games_price_board` failed: `games` must be between 2 and 4 names."




def message(text: str, **data) -> dict:
    parts: list[dict] = [{"kind": "text", "text": text}]
    if data:
        parts.append({"kind": "data", "data": data})
    return {"kind": "message", "role": "user", "messageId": "m", "parts": parts}


class HelperTests(unittest.TestCase):
    def test_cents_reads_steams_integer_prices(self):
        self.assertEqual(cents(999), 9.99)
        self.assertEqual(cents("1999"), 19.99)
        self.assertIsNone(cents(None))
        self.assertIsNone(cents(-1))

    def test_a_review_share_of_zero_reviews_is_none(self):
        self.assertIsNone(review_ratio(0, 0))
        self.assertEqual(review_ratio(3, 1), 0.75)

    def test_usd_says_free_and_unpriced_plainly(self):
        self.assertEqual(usd(0), "free")
        self.assertEqual(usd(None), "not priced")
        self.assertEqual(usd(9.99), "$9.99")

    def test_day_reads_steam_seconds(self):
        self.assertEqual(day(0), "1970-01-01")
        self.assertIsNone(day("not a date"))

    def test_a_sequel_keeps_its_number(self):
        self.assertEqual(name_from_text("how much is portal 2 on steam"), "portal 2")

    def test_a_comparison_splits_on_and(self):
        self.assertEqual(names_from_compare("compare elden ring and dark souls 3"),
                         ["elden ring", "dark souls 3"])

    def test_quoted_names_win_in_a_comparison(self):
        self.assertEqual(names_from_compare('compare "elden ring" and "dark souls 3"'),
                         ["elden ring", "dark souls 3"])

    def test_games_from_data_reads_a_string_or_a_list(self):
        self.assertEqual(games_from_data(["a game", "b game"]), ["a game", "b game"])
        self.assertEqual(games_from_data("elden ring, dark souls 3"),
                         ["elden ring", "dark souls 3"])
        self.assertEqual(games_from_data(None), [])


class RouteTests(unittest.TestCase):
    def test_a_price_question_searches(self):
        skill, params = route("how much is portal 2 on steam?")
        self.assertEqual(skill, SKILL_SEARCH)
        self.assertEqual(params["term"], "portal 2")

    def test_a_player_question_reads_stats(self):
        skill, params = route("how many people play rust right now?")
        self.assertEqual(skill, SKILL_STATS)
        self.assertEqual(params["term"], "rust")

    def test_a_review_question_reads_stats(self):
        self.assertEqual(route("is hades well reviewed?")[0], SKILL_STATS)

    def test_a_news_question_reads_news(self):
        skill, params = route("any news for stardew valley?")
        self.assertEqual(skill, SKILL_NEWS)
        self.assertEqual(params["term"], "stardew valley")

    def test_the_epic_question_reads_the_free_feed(self):
        self.assertEqual(route("what is free on epic this week?")[0], SKILL_FREE)

    def test_a_named_game_that_is_free_is_still_a_lookup(self):
        # "is hades free" names a game; only a sentence pointing at the feed is the Epic feed.
        self.assertEqual(route("is hades free?")[0], SKILL_SEARCH)

    def test_a_comparison_reads_the_board(self):
        skill, params = route("compare elden ring and dark souls 3")
        self.assertEqual(skill, SKILL_BOARD)
        self.assertEqual(params["games"], ["elden ring", "dark souls 3"])

    def test_an_app_id_is_read_from_prose_and_from_a_url(self):
        self.assertEqual(route("what is app 620?")[1]["app_id"], 620)
        self.assertEqual(
            route("https://store.steampowered.com/app/413150/stardew_valley/")[1]["app_id"],
            413150)

    def test_empty_and_help_go_to_help(self):
        self.assertEqual(route("")[0], SKILL_HELP)
        self.assertEqual(route("what can you do?")[0], SKILL_HELP)


class ParseTests(unittest.TestCase):
    def test_a_data_part_names_the_skill_and_the_parameters(self):
        parsed = parse(message("ignore me", skill=SKILL_STATS, term="rust"))
        self.assertEqual(parsed["skill"], SKILL_STATS)
        self.assertEqual(parsed["params"]["term"], "rust")
        self.assertTrue(parsed["explicit"])

    def test_a_game_name_in_a_data_part_needs_no_prose(self):
        parsed = parse({"parts": [{"kind": "data", "data": {"term": "portal 2"}}]})
        self.assertEqual(parsed["skill"], SKILL_SEARCH)
        self.assertEqual(parsed["params"]["term"], "portal 2")

    def test_a_bare_follow_up_is_not_explicit(self):
        # A one-word answer to "which game?" must not look like a fresh question.
        parsed = parse(message("portal 2"))
        self.assertEqual(parsed["params"]["term"], "portal 2")
        self.assertFalse(parsed["explicit"])

    def test_a_question_with_its_own_intent_is_explicit(self):
        self.assertTrue(parse(message("how many people play rust right now?"))["explicit"])
        self.assertTrue(parse(message("compare elden ring and dark souls 3"))["explicit"])
        self.assertTrue(parse(message("what is free on epic this week?"))["explicit"])

    def test_help_is_explicit_but_an_empty_message_is_not(self):
        self.assertTrue(parse(message("help"))["explicit"])
        self.assertFalse(parse({"parts": [{"kind": "text", "text": ""}]})["explicit"])

    def test_a_board_keeps_the_named_games(self):
        parsed = parse(message("compare them", skill=SKILL_BOARD,
                               games=["a game", "b game", "c game"]))
        self.assertEqual(parsed["skill"], SKILL_BOARD)
        self.assertEqual(parsed["params"]["games"], ["a game", "b game", "c game"])

    def test_an_app_id_makes_the_turn_explicit(self):
        parsed = parse(message("app 620"))
        self.assertEqual(parsed["params"]["app_id"], 620)
        self.assertTrue(parsed["explicit"])


class SearchTests(unittest.TestCase):
    def test_search_returns_the_stores_own_prices_cheapest_first(self):
        data, _ = client()
        result = run_search({"term": "portal", "app_id": None, "limit": None}, data)
        rows = result["artifact"]["rows"]
        self.assertEqual(result["final_state"], "completed")
        self.assertEqual([row["name"] for row in rows], ["Portal", "Portal 2", "Counter-Strike 2"])
        self.assertEqual(rows[0]["price"], 4.99)
        self.assertEqual(rows[1]["price"], 9.99)
        # No price object at all means the store prices it at nothing: free-to-play.
        self.assertTrue(rows[2]["is_free"])

    def test_search_names_the_store_as_its_source(self):
        data, _ = client()
        result = run_search({"term": "portal", "app_id": None, "limit": None}, data)
        self.assertEqual(result["artifact"]["dataset"], DATASET_STEAM)
        self.assertIn(DATASET_STEAM, result["message"])

    def test_an_app_id_uses_the_app_details_endpoint(self):
        data, _ = client()
        result = run_search({"term": None, "app_id": 620, "limit": None}, data)
        artifact = result["artifact"]
        self.assertEqual(artifact["name"], "Portal 2")
        self.assertEqual(artifact["price"], 9.99)
        self.assertIn("-50%", result["message"])

    def test_the_limit_is_clamped_not_trusted(self):
        data, calls = client()
        result = run_search({"term": "portal", "app_id": None, "limit": 99}, data)
        self.assertLessEqual(len(result["artifact"]["rows"]), 15)
        self.assertTrue(calls)

    def test_a_store_with_nothing_is_an_upstream_error(self):
        data, _ = client(fail="storesearch")
        with self.assertRaises(UpstreamError):
            run_search({"term": "portal", "app_id": None, "limit": None}, data)

    def test_an_impossible_term_is_rejected_before_any_request(self):
        data, calls = client()
        with self.assertRaises(ValueError):
            run_search({"term": " ", "app_id": None, "limit": None}, data)
        self.assertEqual(calls, [])


class StatsTests(unittest.TestCase):
    def test_stats_keeps_owners_as_the_range_steamspy_published(self):
        data, _ = client()
        result = run_stats({"term": "rust", "app_id": None}, data)
        artifact = result["artifact"]
        self.assertEqual(artifact["owners"], "15,000,000 .. 30,000,000")
        self.assertEqual(artifact["ccu"], 97509)
        self.assertIn("15,000,000 .. 30,000,000", result["message"])

    def test_a_playtime_of_zero_is_reported_as_no_sample(self):
        data, _ = client()
        result = run_stats({"term": "rust", "app_id": None}, data)
        self.assertIsNone(result["artifact"]["average_forever_minutes"])
        self.assertEqual(result["artifact"]["median_forever_minutes"], 1200)
        self.assertIn("median playtime", result["message"])
        self.assertIn("0 in a playtime field means no sample", result["message"])

    def test_the_review_share_and_tags_come_from_the_feed(self):
        data, _ = client()
        result = run_stats({"term": "rust", "app_id": None}, data)
        self.assertEqual(result["artifact"]["review_ratio"], 0.8)
        self.assertEqual(result["artifact"]["tags"][0], "Survival")

    def test_an_app_id_skips_the_search(self):
        data, calls = client()
        result = run_stats({"term": None, "app_id": 620}, data)
        self.assertEqual(result["artifact"]["matched_by"], "app id")
        self.assertTrue(all("storesearch" not in call["url"] for call in calls))

    def test_steamspy_with_nothing_is_an_upstream_error(self):
        data, _ = client(fail="steamspy")
        with self.assertRaises(UpstreamError):
            run_stats({"term": "rust", "app_id": None}, data)


class NewsTests(unittest.TestCase):
    def test_news_returns_titles_dates_and_links(self):
        data, _ = client()
        result = run_news({"term": "stardew valley", "app_id": None}, data)
        rows = result["artifact"]["rows"]
        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[0]["title"], "Stardew Valley 1.6.9 released")
        self.assertIn(day(1710000000), result["message"])
        self.assertIn("ISteamNews", result["message"])

    def test_a_feed_with_nothing_is_an_upstream_error(self):
        data, _ = client(fail="ISteamNews")
        with self.assertRaises(UpstreamError):
            run_news({"term": "stardew valley", "app_id": None}, data)


class FreeTests(unittest.TestCase):
    def test_the_free_feed_splits_now_from_coming(self):
        data, _ = client()
        result = run_free(data)
        artifact = result["artifact"]
        self.assertEqual([row["title"] for row in artifact["now"]],
                         ["Ghostrunner", "Some Paid Game"])
        self.assertEqual([row["title"] for row in artifact["soon"]], ["Suicide Squad"])
        # Only a zero discount price is free; a discounted one is still a paid offer.
        self.assertTrue(artifact["now"][0]["free"])
        self.assertFalse(artifact["now"][1]["free"])

    def test_the_free_answer_names_the_epic_feed(self):
        data, _ = client()
        result = run_free(data)
        self.assertEqual(result["artifact"]["dataset"], DATASET_EPIC)
        self.assertIn(DATASET_EPIC, result["message"])

    def test_an_unreadable_catalogue_is_an_upstream_error(self):
        data, _ = client(fail="epicgames")
        with self.assertRaises(UpstreamError):
            run_free(data)




class AgentTests(unittest.TestCase):

    def test_the_card_lists_every_skill_in_order(self):
        skills = [skill["id"] for skill in GamesAgent.card_skills]
        self.assertEqual(skills, list(SKILLS))
        self.assertEqual(GamesAgent.datasets, (DATASET_STEAM, DATASET_STEAMSPY, DATASET_EPIC))
        self.assertEqual(GamesAgent.watch_kinds, ())






    def test_help_is_the_answer_for_an_unknown_skill(self):
        result = run_help()
        self.assertEqual(result["artifact"]["skill"], SKILL_HELP)





if __name__ == "__main__":
    unittest.main(verbosity=2)
