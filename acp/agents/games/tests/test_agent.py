"""Tests for the games agent: Steam/SteamSpy/Epic readers, routing, skills, premium board.

    python3 agents/games/tests/test_agent.py
"""

from __future__ import annotations

import json
import os
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

from acp_kit import AcpClient, Connection, GatewayClient, STOP_END_TURN, STOP_REFUSAL  # noqa: E402

from agent import GamesAgent, day, name_from_text, names_from_compare, route, usd  # noqa: E402
from data import (  # noqa: E402
    DATASET_EPIC,
    DATASET_STEAM,
    DATASET_STEAMSPY,
    GamesData,
    GamesError,
    cents,
    review_ratio,
)

# ---------------------------------------------------------------------------
# Feed payloads in the shapes Steam, SteamSpy and Epic really send
# ---------------------------------------------------------------------------

STEAM_SEARCH = {
    "total": 10,
    "items": [
        {"type": "app", "name": "Portal 2", "id": 620,
         "price": {"currency": "USD", "initial": 999, "final": 999},
         "tiny_image": "https://cdn.akamai.steamstatic.com/620.jpg", "metascore": "95"},
        {"type": "app", "name": "Portal", "id": 400,
         "price": {"currency": "USD", "initial": 999, "final": 499},
         "tiny_image": "https://cdn.akamai.steamstatic.com/400.jpg", "metascore": "90"},
    ],
}

STEAM_APP = {
    "620": {"success": True, "data": {
        "name": "Portal 2", "type": "game", "is_free": False,
        "price_overview": {"currency": "USD", "initial": 999, "final": 999, "discount_percent": 0},
        "release_date": {"date": "Apr 18, 2011"},
        "developers": ["Valve"], "publishers": ["Valve"],
        "genres": [{"description": "Puzzle"}, {"description": "Adventure"}],
        "categories": [{"description": "Single-player"}, {"description": "Co-op"}],
        "short_description": "Portal 2 draws from the award-winning formula of innovative gameplay.",
        "header_image": "https://cdn.akamai.steamstatic.com/620/header.jpg",
    }},
}

STEAM_NEWS = {"appnews": {"appid": 620, "newsitems": [
    {"title": "Portal 2 update released", "date": 1790187113, "feedlabel": "Steam News",
     "url": "https://store.steampowered.com/news/app/620/view/1",
     "contents": "A small update fixes a crash on startup."},
]}}

STEAMSPY = {
    "appid": 620, "name": "Portal 2", "developer": "Valve", "publisher": "Valve",
    "positive": 95, "negative": 5, "owners": "50,000,000 .. 100,000,000", "ccu": 4000,
    "average_forever": 0, "median_forever": 120, "price": "999",
    "tags": {"Puzzle": 100, "Co-op": 40},
}

EPIC = {"data": {"Catalog": {"searchStore": {"elements": [
    {"title": "Them's Fightin' Herds", "id": "abc", "offerType": "BASE_GAME",
     "price": {"totalPrice": {"discountPrice": 0, "originalPrice": 1999, "currencyCode": "USD"}},
     "promotions": {"promotionalOffers": [
         {"startDate": "2026-09-24T15:00:00.000Z", "endDate": "2026-10-01T15:00:00.000Z"}]},
     "catalogNs": {"mappings": [{"pageSlug": "thems-fightin-herds"}]},
     "keyImages": [{"type": "OfferImageTall", "url": "https://cdn.epicgames.com/1.jpg"}]},
    {"title": "Next Week Game", "id": "def",
     "price": {"totalPrice": {"discountPrice": 2999, "originalPrice": 2999, "currencyCode": "USD"}},
     "promotions": {"upcomingPromotionalOffers": [
         {"startDate": "2026-10-01T15:00:00.000Z", "endDate": "2026-10-08T15:00:00.000Z"}]},
     "catalogNs": {"mappings": [{"pageSlug": "next-week-game"}]},
     "keyImages": []},
]}}}}


def dispatch(url: str, params: dict):
    """Answer by endpoint: the games reader always calls the same four services."""
    if "storesearch" in url:
        return STEAM_SEARCH
    if "appdetails" in url:
        return STEAM_APP
    if "GetNewsForApp" in url:
        return STEAM_NEWS
    if "steamspy" in url:
        return STEAMSPY
    if "epicgames" in url:
        return EPIC
    return {}


class FakeData(GamesData):
    """Same interface as the real reader, no network."""

    def __init__(self, raise_error: bool = False) -> None:
        self.raise_error = raise_error
        self.calls: list[dict] = []

    def search(self, term: str, limit: int = 5) -> dict:
        if self.raise_error:
            raise GamesError(f"the Steam store has nothing for {term!r}")
        self.calls.append({"kind": "search", "term": term})
        rows = [{"app_id": 400, "name": "Portal", "price": 4.99, "initial": 9.99,
                 "currency": "USD", "is_free": False, "metascore": "90",
                 "url": "https://store.steampowered.com/app/400"},
                {"app_id": 620, "name": "Portal 2", "price": 9.99, "initial": 9.99,
                 "currency": "USD", "is_free": False, "metascore": "95",
                 "url": "https://store.steampowered.com/app/620"}]
        return {"query": term, "rows": rows[:limit], "total": 10, "all": rows}

    def best_match(self, term: str, app_id=None) -> dict:
        self.calls.append({"kind": "match", "term": term, "app_id": app_id})
        return {"app_id": 620, "name": "Portal 2", "matched": "exact name", "price": 9.99}

    def app(self, app_id) -> dict:
        self.calls.append({"kind": "app", "app_id": app_id})
        return {"app_id": 620, "name": "Portal 2", "type": "game", "is_free": False,
                "price": 9.99, "initial": 9.99, "discount_percent": 0, "currency": "USD",
                "release_date": "Apr 18, 2011", "developers": ["Valve"], "publishers": ["Valve"],
                "genres": ["Puzzle", "Adventure"], "categories": ["Single-player"],
                "short_description": "A first-person puzzle game.",
                "header_image": "https://cdn.akamai.steamstatic.com/620/header.jpg",
                "url": "https://store.steampowered.com/app/620"}

    def stats(self, app_id) -> dict:
        if self.raise_error:
            raise GamesError(f"SteamSpy has no data for app {app_id}")
        self.calls.append({"kind": "stats", "app_id": app_id})
        return {"app_id": 620, "name": "Portal 2", "developer": "Valve", "publisher": "Valve",
                "owners": "50,000,000 .. 100,000,000", "ccu": 4000, "positive": 95, "negative": 5,
                "review_ratio": 0.95, "average_forever_minutes": None,
                "median_forever_minutes": 120, "tags": ["Puzzle", "Co-op"],
                "url": "https://steamspy.com/app/620"}

    def news(self, app_id, count: int = 3) -> dict:
        if self.raise_error:
            raise GamesError(f"Steam's news feed has nothing for app {app_id}")
        self.calls.append({"kind": "news", "app_id": app_id})
        return {"app_id": 620, "rows": [{"title": "Portal 2 update released",
                                         "date": 1790187113, "feed": "Steam News",
                                         "url": "https://store.steampowered.com/news/app/620/view/1",
                                         "excerpt": "A small update fixes a crash on startup."}]}

    def free_games(self) -> dict:
        if self.raise_error:
            raise GamesError("Epic returned an unexpected payload (no catalogue elements)")
        self.calls.append({"kind": "free"})
        return {"now": [{"title": "Them's Fightin' Herds", "id": "abc", "slug": "thems-fightin-herds",
                         "url": "https://store.epicgames.com/en-US/p/thems-fightin-herds",
                         "original": 19.99, "discount_price": 0, "currency": "USD",
                         "image": None, "free": True,
                         "window": {"starts": "2026-09-24T15:00:00.000Z",
                                    "ends": "2026-10-01T15:00:00.000Z"}}],
                "soon": [{"title": "Next Week Game", "id": "def", "slug": "next-week-game",
                          "url": "https://store.epicgames.com/en-US/p/next-week-game",
                          "original": 29.99, "discount_price": 29.99, "currency": "USD",
                          "image": None, "free": True,
                          "window": {"starts": "2026-10-01T15:00:00.000Z",
                                     "ends": "2026-10-08T15:00:00.000Z"}}]}


class QueueReader:
    """One side's inbox: an iterator of lines, plus push to add one."""

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


class ReaderTests(unittest.TestCase):
    def test_money_and_ratios(self):
        self.assertEqual(cents(999), 9.99)
        self.assertIsNone(cents(None))
        self.assertEqual(review_ratio(95, 5), 0.95)
        self.assertIsNone(review_ratio(0, 0))

    def test_search_is_cheapest_first_with_store_prices(self):
        data = GamesData(fetch=dispatch)
        result = data.search("portal")
        self.assertEqual([row["name"] for row in result["rows"]], ["Portal", "Portal 2"])
        self.assertEqual(result["rows"][0]["price"], 4.99)
        self.assertEqual(result["rows"][1]["metascore"], "95")

    def test_app_details_are_filtered(self):
        data = GamesData(fetch=dispatch)
        app = data.app(620)
        self.assertEqual(app["name"], "Portal 2")
        self.assertEqual(app["price"], 9.99)
        self.assertEqual(app["release_date"], "Apr 18, 2011")
        self.assertIn("Puzzle", app["genres"])

    def test_stats_keep_the_owner_range_and_call_zero_playtime_unreported(self):
        data = GamesData(fetch=dispatch)
        stats = data.stats(620)
        self.assertEqual(stats["owners"], "50,000,000 .. 100,000,000")
        self.assertEqual(stats["ccu"], 4000)
        self.assertIsNone(stats["average_forever_minutes"])
        self.assertEqual(stats["median_forever_minutes"], 120)

    def test_news_dates_are_unix_seconds(self):
        data = GamesData(fetch=dispatch)
        feed = data.news(620)
        self.assertEqual(feed["rows"][0]["title"], "Portal 2 update released")
        self.assertEqual(day(feed["rows"][0]["date"]), "2026-09-23")

    def test_epic_free_games_split_now_from_soon(self):
        data = GamesData(fetch=dispatch)
        free = data.free_games()
        self.assertEqual([row["title"] for row in free["now"]], ["Them's Fightin' Herds"])
        self.assertTrue(free["now"][0]["free"])
        self.assertEqual([row["title"] for row in free["soon"]], ["Next Week Game"])

    def test_an_unknown_app_is_an_error(self):
        data = GamesData(fetch=lambda url, params: {})
        with self.assertRaises(GamesError):
            data.app(620)


class RouteTests(unittest.TestCase):
    def test_help(self):
        self.assertEqual(route("")[0], "help")
        self.assertEqual(route("what can you do?")[0], "help")

    def test_price_question_is_a_search(self):
        skill, params = route("how much is portal 2 on steam")
        self.assertEqual(skill, "game-search")
        self.assertEqual(params["term"], "portal 2")

    def test_player_count_question_is_the_stats_skill(self):
        skill, params = route("how many people play rust right now")
        self.assertEqual(skill, "game-stats")
        self.assertEqual(params["term"], "rust")

    def test_review_question_is_the_stats_skill(self):
        self.assertEqual(route("is hades well reviewed")[0], "game-stats")

    def test_news_question(self):
        skill, params = route("any news for stardew valley")
        self.assertEqual(skill, "game-news")
        self.assertEqual(params["term"], "stardew valley")

    def test_free_games_question(self):
        self.assertEqual(route("what is free on epic this week")[0], "free-games")

    def test_a_title_that_is_free_is_a_lookup_not_the_feed(self):
        skill, params = route("is hades free")
        self.assertEqual(skill, "game-search")
        self.assertEqual(params["term"], "hades")

    def test_compare_is_the_premium_board(self):
        skill, params = route("compare elden ring and dark souls 3")
        self.assertEqual(skill, "price-board")
        self.assertEqual(params["games"], ["elden ring", "dark souls 3"])

    def test_one_title_never_routes_to_the_board(self):
        self.assertEqual(route("compare portal 2 prices")[0], "game-search")

    def test_app_id_and_url(self):
        skill, params = route("what is app 620")
        self.assertEqual(skill, "game-search")
        self.assertEqual(params["app_id"], 620)
        skill, params = route("look at https://store.steampowered.com/app/400")
        self.assertEqual(params["app_id"], 400)

    def test_name_extraction_is_conservative(self):
        self.assertIsNone(name_from_text("what can you do"))
        self.assertEqual(names_from_compare('compare "elden ring" and "hades"'),
                         ["elden ring", "hades"])


class TurnTests(unittest.TestCase):
    def turn(self, text: str, data: FakeData | None = None, permission: str = "allow-once"):
        agent_conn, client_conn = connected_pair()
        agent = GamesAgent(agent_conn, data or FakeData())
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission=permission)
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            return client.prompt(text, session_id), client
        finally:
            client.stop()

    def test_search_reports_store_prices(self):
        result, client = self.turn("how much is portal 2 on steam")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("Steam store matches for 'portal 2'", result["text"])
        self.assertIn("Portal — $4.99 — metascore 90", result["text"])
        tools = [update for update in result["updates"] if update.get("sessionUpdate") == "tool_call"]
        self.assertEqual(tools[0]["name"], "game-search")
        self.assertEqual(len(client.permission_requests), 1)

    def test_stats_names_the_owner_range_and_the_playtime_gap(self):
        result, _ = self.turn("how many people play portal 2 right now")
        self.assertIn("owners: 50,000,000 .. 100,000,000", result["text"])
        self.assertIn("playing right now: 4,000", result["text"])
        self.assertIn("95.0% positive", result["text"])
        # SteamSpy reported average_forever as 0 and a real median, so only the median is shown.
        self.assertIn("median playtime: 2.0 hours", result["text"])
        self.assertIn("0 in a playtime field means no sample rather than no play", result["text"])

    def test_news_lists_dated_items(self):
        result, _ = self.turn("any news for portal 2")
        self.assertIn("Steam news for Portal 2 (app 620)", result["text"])
        self.assertIn("2026-09-23 — Portal 2 update released", result["text"])

    def test_free_games_names_the_window(self):
        result, _ = self.turn("what is free on epic this week")
        self.assertIn("Them's Fightin' Herds — free", result["text"])
        self.assertIn("normally $19.99, until 2026-10-01", result["text"])
        self.assertIn("Coming next:", result["text"])

    def test_app_id_lookup(self):
        result, _ = self.turn("what is app 620")
        self.assertIn("Portal 2 (Steam app 620)", result["text"])
        self.assertIn("released: Apr 18, 2011", result["text"])

    def test_an_empty_ask_asks_for_a_game(self):
        result, _ = self.turn("hi")
        self.assertIn("Which game should I look up?", result["text"])

    def test_help_does_not_ask_permission(self):
        result, client = self.turn("what can you do?")
        self.assertIn("SteamSpy", result["text"])
        self.assertEqual(client.permission_requests, [])

    def test_permission_denied(self):
        result, _ = self.turn("how much is portal 2", permission="reject")
        self.assertEqual(result["stopReason"], STOP_REFUSAL)
        self.assertIn("need permission", result["text"])

    def test_a_feed_failure_is_reported(self):
        result, _ = self.turn("how many people play portal 2", data=FakeData(raise_error=True))
        self.assertIn("could not read the games feeds", result["text"])
        statuses = [update.get("status") for update in result["updates"]
                    if update.get("sessionUpdate") == "tool_call_update"]
        self.assertIn("failed", statuses)

    def test_usd_formatting(self):
        self.assertEqual(usd(9.99), "$9.99")
        self.assertEqual(usd(0), "free")
        self.assertEqual(usd(None), "not priced")


# ---------------------------------------------------------------------------
# Premium: the cross-title board is computed on the licence gateway
# ---------------------------------------------------------------------------

BOARD_PAYLOAD = {
    "games": [
        {"query": "elden ring", "appId": 1245620, "name": "ELDEN RING", "price": 59.99,
         "owners": "10,000,000 .. 20,000,000", "ccu": 45000, "reviewRatio": 0.92,
         "positive": 600000, "negative": 52000, "release": "Feb 25, 2022"},
        {"query": "dark souls 3", "appId": 374320, "name": "DARK SOULS III", "price": 59.99,
         "owners": "5,000,000 .. 10,000,000", "ccu": 9000, "reviewRatio": 0.94,
         "positive": 300000, "negative": 19000, "release": "Mar 31, 2016"},
    ],
    "cheapest": {"name": "ELDEN RING", "price": 59.99},
    "dearest": {"name": "DARK SOULS III", "price": 59.99},
    "mostPlayed": {"name": "ELDEN RING", "ccu": 45000},
    "bestReviewed": {"name": "DARK SOULS III", "reviewRatio": 0.94},
}

#: The gateway words its own refusals, buy link included, and the agent must not rewrite them.
REFUSAL_TEXT = (
    "This is a premium skill and needs a valid license key. "
    "Get one at https://polar.sh/mrfentmen and set MCP_LICENSE_KEY."
)


def mcp_result(payload, is_error=False, structured=None):
    result = {"content": [{"type": "text", "text": json.dumps(payload)}]}
    if is_error:
        result["isError"] = True
    if structured is not None:
        result["structuredContent"] = structured
    return {"jsonrpc": "2.0", "id": 1, "result": result}


def make_gateway(key, result):
    """A real GatewayClient with the transport injected - no network, ever."""
    calls = []

    def fetch(url, payload, headers):
        calls.append({"tool": payload["params"]["name"],
                      "arguments": payload["params"]["arguments"],
                      "authorized": "Authorization" in headers})
        return result

    client = GatewayClient(fetch=fetch, url="http://127.0.0.1:8787/mcp", key=key)
    client.calls = calls
    return client


class PremiumBoardTests(unittest.TestCase):
    def premium_turn(self, text, gateway, permission="allow-once"):
        agent_conn, client_conn = connected_pair()
        agent = GamesAgent(agent_conn, FakeData(), gateway)
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission=permission)
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            return client.prompt(text, session_id), client
        finally:
            client.stop()

    def test_no_key_returns_the_gateways_own_wording(self):
        saved = os.environ.pop("MCP_LICENSE_KEY", None)
        try:
            result, _ = self.premium_turn("compare elden ring and dark souls 3",
                                          make_gateway("", mcp_result(BOARD_PAYLOAD)))
        finally:
            if saved is not None:
                os.environ["MCP_LICENSE_KEY"] = saved
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("premium skill", result["text"])
        self.assertIn("MCP_LICENSE_KEY", result["text"])

    def test_a_bad_key_is_answered_not_crashed(self):
        gateway = make_gateway("lic_live_but_rejected", mcp_result(
            REFUSAL_TEXT, is_error=True,
            structured={"licenceRefusal": True, "reason": "denied"}))
        result, _ = self.premium_turn("compare elden ring and dark souls 3", gateway)
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("polar.sh", result["text"])

    def test_a_good_key_gets_the_board_and_the_gateway_did_the_work(self):
        gateway = make_gateway("lic_granted", mcp_result(BOARD_PAYLOAD))
        result, client = self.premium_turn("compare elden ring and dark souls 3", gateway)
        self.assertIn("computed on the licence gateway", result["text"])
        self.assertIn("ELDEN RING (asked: elden ring): $59.99 — 92% of reviews positive", result["text"])
        self.assertIn("Most played right now: ELDEN RING with 45,000 players.", result["text"])
        self.assertEqual(gateway.calls[0]["tool"], "games_price_board")
        self.assertTrue(gateway.calls[0]["authorized"])
        self.assertEqual(gateway.calls[0]["arguments"]["games"], ["elden ring", "dark souls 3"])
        self.assertEqual(len(client.permission_requests), 1)

    def test_free_skills_never_reach_the_gateway(self):
        gateway = make_gateway("lic_granted", mcp_result(BOARD_PAYLOAD))
        for text in ("how much is portal 2", "how many people play portal 2",
                     "what is free on epic this week"):
            self.premium_turn(text, gateway)
        self.assertEqual(gateway.calls, [])

    def test_dataset_constants_are_the_endpoints_the_reader_calls(self):
        self.assertIn("store.steampowered.com", DATASET_STEAM)
        self.assertIn("steamspy", DATASET_STEAMSPY)
        self.assertIn("epicgames", DATASET_EPIC)


if __name__ == "__main__":
    unittest.main()
