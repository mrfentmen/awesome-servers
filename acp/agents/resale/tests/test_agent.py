
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

from acp_kit import AcpClient, Connection, STOP_END_TURN, STOP_REFUSAL

from agent import ResaleAgent, keyword_from_text, route, singular, usd  # noqa: E402
from data import (  # noqa: E402
    DATASET_FASHIONPHILE,
    DATASET_REBAG,
    ResaleData,
    ResaleError,
    brand_key,
    brands_in_text,
    category_in_text,
    condition_from_variant,
    money,
)

# ---------------------------------------------------------------------------
# Catalogue payloads in the shapes the two stores really send
# ---------------------------------------------------------------------------

CHANEL_NECKLACE = {
    "id": 16194267218223,
    "title": "Pearl Crystal Baguette Beaded Wing Long Necklace Black Gold",
    "handle": "chanel-pearl-crystal-baguette-necklace-1984481",
    "vendor": "Chanel", "product_type": "Jewelry", "tags": ["US"],
    "variants": [{"title": "Default Title", "price": "775.00", "available": True}],
    "images": [{"src": "https://cdn.fashionphile.com/1.jpg"}],
}
CHANEL_POUCH = {
    "id": 16194267218224,
    "title": "Caviar Quilted Small French New Wave CC Pouch Blue",
    "handle": "chanel-caviar-quilted-pouch-1984482",
    "vendor": "Chanel", "product_type": "Accessories", "tags": [],
    "variants": [{"title": "Default Title", "price": "825.00", "available": False}],
    "images": [],
}
GUCCI_BAG = {
    "id": 9046711206065,
    "title": "Crystal Animalier Shoulder Bag Leather Medium",
    "handle": "handbags-gucci-crystal-animalier-435909",
    "vendor": "Gucci", "product_type": "Cross body bags", "tags": [],
    "variants": [{"title": "Very Good | Item # 435909/1 / green", "price": "795.00", "available": False}],
    "images": [{"src": "https://cdn.rebag.com/1.jpg"}],
}
HERMES_BAG = {
    "id": 9046711206066,
    "title": "Maxibox Bag Evercolor 29",
    "handle": "handbags-hermes-maxibox-bag-evercolor-294167871",
    "vendor": "Hermes", "product_type": "Top handle", "tags": [],
    "variants": [{"title": "Pristine | Item # 416787/1 / green", "price": "3825.00", "available": True}],
    "images": [],
}
ROLEX_WATCH = {
    "id": 9046711206067,
    "title": "Datejust 36mm Stainless Steel Watch",
    "handle": "watches-rolex-datejust-36mm-412345",
    "vendor": "Rolex", "product_type": "Watches", "tags": [],
    "variants": [{"title": "Excellent | Item # 412345/1 / silver", "price": "9500.00", "available": True}],
    "images": [{"src": "https://cdn.rebag.com/2.jpg"}],
}

FASHIONPHILE_PAGE = {"products": [CHANEL_NECKLACE, CHANEL_POUCH]}
REBAG_PAGE = {"products": [GUCCI_BAG, HERMES_BAG, ROLEX_WATCH]}


def dispatch(url: str, params: dict):
    """Answer by store, and by single-listing endpoint. Page two of a small store is empty."""
    if "/products/" in url and url.endswith(".js"):
        handle = url.rsplit("/", 1)[-1][:-3]
        for product in (CHANEL_NECKLACE, CHANEL_POUCH, GUCCI_BAG, HERMES_BAG, ROLEX_WATCH):
            if product["handle"] == handle:
                return {**product, "body_html": "<p>These are professional pictures of the "
                                                 "actual item.</p>"}
        return {}
    if str(params.get("page", "1")) != "1":
        return {"products": []}
    if "fashionphile" in url:
        return FASHIONPHILE_PAGE
    if "rebag" in url:
        return REBAG_PAGE
    return {"products": []}


class FakeData(ResaleData):
    """Same interface as the real reader, no network."""

    def __init__(self, raise_error: bool = False) -> None:
        self.raise_error = raise_error
        self.calls: list[dict] = []

    def search(self, brand: str | None, keyword: str | None, limit: int = 5) -> dict:
        if self.raise_error:
            raise ResaleError("neither catalogue has a listing matching that")
        self.calls.append({"kind": "search", "brand": brand, "keyword": keyword})
        rows = [self.slim(DATASET_FASHIONPHILE, CHANEL_NECKLACE),
                self.slim(DATASET_FASHIONPHILE, CHANEL_POUCH),
                self.slim(DATASET_REBAG, HERMES_BAG)]
        return {"brand": brand, "keyword": keyword, "rows": rows[:limit], "read": 750,
                "sources": [DATASET_FASHIONPHILE, DATASET_REBAG]}

    def brand_market(self, brand: str, pages: int = 2) -> dict:
        if self.raise_error:
            raise ResaleError("neither catalogue listed that")
        self.calls.append({"kind": "market", "brand": brand})
        rows = [self.slim(DATASET_FASHIONPHILE, CHANEL_NECKLACE),
                self.slim(DATASET_FASHIONPHILE, CHANEL_POUCH)]
        return {"brand": brand_key(brand), "rows": rows, "count": 2, "available": 1, "listed": 1,
                "priced": 2, "low": 775.0, "high": 825.0, "median": 800.0,
                "conditions": {}, "types": {"Jewelry": 1, "Accessories": 1},
                "by_source": {DATASET_FASHIONPHILE: 2}, "read": 500,
                "sources": [DATASET_FASHIONPHILE]}

    def listing(self, source: str, handle: str) -> dict:
        if self.raise_error or "nope" in handle:
            raise ResaleError(f"{source} has nothing at that handle")
        self.calls.append({"kind": "listing", "source": source, "handle": handle})
        row = self.slim(DATASET_REBAG, HERMES_BAG)
        row["description"] = "These are professional pictures of the actual item."
        return row


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
    def test_validation(self):
        self.assertEqual(ResaleData.check_brand("  Chanel "), "chanel")
        self.assertEqual(ResaleData.check_query("  birkin  bag "), "birkin bag")
        self.assertEqual(ResaleData.check_handle("https://shop.rebag.com/products/handbags-hermes-maxibox-bag-evercolor-294167871"),
                         "handbags-hermes-maxibox-bag-evercolor-294167871")
        with self.assertRaises(ValueError):
            ResaleData.check_query("!")

    def test_prices_come_from_the_variants(self):
        self.assertEqual(money("775.00"), 775.0)
        self.assertIsNone(money(None))
        self.assertIsNone(money("call for price"))

    def test_only_rebag_states_a_condition(self):
        self.assertEqual(condition_from_variant("Very Good | Item # 435909/1 / green"), "very good")
        self.assertIsNone(condition_from_variant("Default Title"))
        self.assertIsNone(condition_from_variant("Mystery | Item # 1"))

    def test_brands_and_categories_are_read_from_a_sentence(self):
        self.assertEqual(brands_in_text("compare chanel and Christian Dior"), ["chanel", "dior"])
        self.assertEqual(brand_key("Christian Dior"), "dior")
        self.assertEqual(brand_key("Tiffany & Co."), "tiffany")
        self.assertEqual(category_in_text("show me rolex watches"), "watches")
        self.assertEqual(category_in_text("show me a necklace"), "jewelry")

    def test_search_filters_by_brand_and_keyword(self):
        data = ResaleData(fetch=dispatch)
        result = data.search("chanel", None)
        self.assertEqual([row["vendor"] for row in result["rows"]], ["Chanel", "Chanel"])
        self.assertEqual(result["rows"][0]["price"], 775.0)
        self.assertEqual(result["rows"][0]["condition"], None)
        keyworded = data.search(None, "necklace")
        self.assertEqual([row["title"] for row in keyworded["rows"]],
                         ["Pearl Crystal Baguette Beaded Wing Long Necklace Black Gold"])

    def test_a_market_read_counts_availability_and_conditions(self):
        data = ResaleData(fetch=dispatch)
        market = data.brand_market("hermes")
        self.assertEqual(market["count"], 1)
        self.assertEqual(market["available"], 1)
        self.assertEqual(market["median"], 3825.0)
        self.assertEqual(market["conditions"], {"pristine": 1})
        # Fashionphile states no condition, so its market read has none to report.
        chanel = data.brand_market("chanel")
        self.assertEqual(chanel["conditions"], {})
        self.assertEqual(chanel["listed"], 1)
        self.assertEqual(chanel["median"], 800.0)

    def test_a_single_listing_is_read_from_the_product_endpoint(self):
        data = ResaleData(fetch=dispatch)
        row = data.listing(DATASET_REBAG, "handbags-hermes-maxibox-bag-evercolor-294167871")
        self.assertEqual(row["vendor"], "Hermes")
        self.assertEqual(row["price"], 3825.0)
        self.assertIn("professional pictures", row["description"])

    def test_nothing_matching_is_an_error(self):
        data = ResaleData(fetch=dispatch)
        with self.assertRaises(ResaleError):
            data.search("rolex", "submariner")

    def test_all_catalogues_down_is_an_error(self):
        data = ResaleData(fetch=lambda url, params: (_ for _ in ()).throw(ResaleError("down")))
        with self.assertRaises(ResaleError):
            data.search("chanel", None)


class RouteTests(unittest.TestCase):
    def test_help(self):
        self.assertEqual(route("")[0], "help")
        self.assertEqual(route("what can you do?")[0], "help")

    def test_brand_search(self):
        skill, params = route("show me rolex watches")
        self.assertEqual(skill, "resale-search")
        self.assertEqual(params["brand"], "rolex")
        self.assertEqual(params["keyword"], "watches")

    def test_market_question(self):
        skill, params = route("what does the chanel market look like right now")
        self.assertEqual(skill, "brand-market")
        self.assertEqual(params["brand"], "chanel")

    def test_price_question_without_a_brand_is_a_search(self):
        skill, params = route("how much is a birkin bag right now")
        self.assertEqual(skill, "resale-search")
        self.assertIsNone(params["brand"])
        self.assertEqual(params["keyword"], "birkin")

    def test_piece_lookup_by_handle_and_by_url(self):
        skill, params = route("pull the listing handbags-hermes-maxibox-bag-evercolor-294167871")
        self.assertEqual(skill, "piece-lookup")
        self.assertEqual(params["handle"], "handbags-hermes-maxibox-bag-evercolor-294167871")
        skill, params = route("what is https://shop.rebag.com/products/handbags-gucci-crystal-435909")
        self.assertEqual(skill, "piece-lookup")
        self.assertEqual(params["source"], DATASET_REBAG)



    def test_singular_helper(self):
        self.assertEqual(singular("watches"), "watch")
        self.assertEqual(singular("necklaces"), "necklace")
        self.assertEqual(singular("totes"), "tote")
        self.assertEqual(singular("birkin"), "birkin")

    def test_keyword_extraction_is_conservative(self):
        self.assertIsNone(keyword_from_text("what can you do?"))
        self.assertIsNone(keyword_from_text("show me chanel"))


class TurnTests(unittest.TestCase):
    def turn(self, text: str, data: FakeData | None = None, permission: str = "allow-once"):
        agent_conn, client_conn = connected_pair()
        agent = ResaleAgent(agent_conn, data or FakeData())
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
        result, client = self.turn("show me chanel jewelry")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("Cheapest matches", result["text"])
        self.assertIn("$775", result["text"])
        self.assertIn("sold, still listed", result["text"])
        self.assertIn("condition: not reported", result["text"])
        tools = [update for update in result["updates"] if update.get("sessionUpdate") == "tool_call"]
        self.assertEqual(tools[0]["name"], "resale-search")
        self.assertEqual(len(client.permission_requests), 1)

    def test_market_read_names_the_spread(self):
        result, _ = self.turn("what does the chanel market look like")
        self.assertIn("The chanel resale market right now", result["text"])
        self.assertIn("median $800", result["text"])
        self.assertIn("1 available, 1 sold-and-still-listed", result["text"])
        self.assertIn("conditions: not reported by these sources", result["text"])

    def test_piece_lookup_reads_one_listing(self):
        result, _ = self.turn("pull the listing handbags-hermes-maxibox-bag-evercolor-294167871")
        self.assertIn("Maxibox Bag Evercolor 29 (Hermes)", result["text"])
        self.assertIn("$3,825", result["text"])
        self.assertIn("condition: pristine", result["text"])

    def test_an_empty_ask_asks_for_something(self):
        result, _ = self.turn("hi")
        self.assertIn("Tell me a brand or a word", result["text"])

    def test_a_greeting_word_that_matches_nothing_is_not_an_outage(self):
        result, _ = self.turn("hello there")
        self.assertIn("Tell me a brand or a word", result["text"])

    def test_help_does_not_ask_permission(self):
        result, client = self.turn("what can you do?")
        self.assertIn("Fashionphile", result["text"])
        self.assertEqual(client.permission_requests, [])

    def test_permission_denied(self):
        result, _ = self.turn("show me chanel bags", permission="reject")
        self.assertEqual(result["stopReason"], STOP_REFUSAL)
        self.assertIn("need permission", result["text"])

    def test_a_feed_failure_is_reported(self):
        result, _ = self.turn("show me chanel bags", data=FakeData(raise_error=True))
        self.assertIn("could not read the resale catalogues", result["text"])
        statuses = [update.get("status") for update in result["updates"]
                    if update.get("sessionUpdate") == "tool_call_update"]
        self.assertIn("failed", statuses)


# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------

INDEX_PAYLOAD = {
    "scanned": 1000,
    "brands": [
        {"brand": "chanel", "count": 83, "available": 70, "listed": 13, "median": 1975.0,
         "low": 725.0, "high": 12000.0, "sources": [DATASET_FASHIONPHILE, DATASET_REBAG]},
        {"brand": "gucci", "count": 61, "available": 44, "listed": 17, "median": 890.0,
         "low": 195.0, "high": 6500.0, "sources": [DATASET_REBAG]},
    ],
    "dearest": {"brand": "chanel", "median": 1975.0},
    "cheapest": {"brand": "gucci", "median": 890.0},
    "mostListed": {"brand": "chanel", "count": 83},
}

#: The gateway words its own refusals, buy link included, and the agent must not rewrite them.


def mcp_result(payload, is_error=False, structured=None):
    result = {"content": [{"type": "text", "text": json.dumps(payload)}]}
    if is_error:
        result["isError"] = True
    if structured is not None:
        result["structuredContent"] = structured
    return {"jsonrpc": "2.0", "id": 1, "result": result}






if __name__ == "__main__":
    unittest.main()
