"""Tests for the designer resale server.

    python3 servers/resale/tests/test_agent.py

The catalogue reader is the real one: only the HTTP fetch is a function, so pagination, the
brand/keyword filters, the medians and the Shopify field handling are all exercised for real.
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

from a2a_kit import GatewayClient, UpstreamError  # noqa: E402

from agent import (  # noqa: E402
    PREMIUM_TOOL,
    SKILLS,
    SKILL_HELP,
    SKILL_INDEX,
    SKILL_MARKET,
    SKILL_PIECE,
    SKILL_SEARCH,
    ResaleAgent,
    parse,
    route,
    run_index,
    run_market,
    run_piece,
    run_search,
    singular,
    usd,
)
from data import (  # noqa: E402
    DATASET_FASHIONPHILE,
    DATASET_REBAG,
    DATASETS,
    MAX_PAGES,
    ResaleClient,
    brand_key,
    brands_in_text,
    condition_from_variant,
    money,
    plain_text,
)

#: Two storefronts as they answered on 2026-09-30: same field names, different condition habits.
FASHIONPHILE = [
    {"title": "Chanel Classic Flap", "vendor": "Chanel", "product_type": "Handbags",
     "handle": "handbags-chanel-classic-flap-1",
     "variants": [{"title": "Default Title", "price": "6500.00", "available": True}],
     "images": [{"src": "https://cdn.example/chanel-flap.jpg"}]},
    {"title": "Hermes Birkin 30", "vendor": "Hermes", "product_type": "Handbags",
     "handle": "handbags-hermes-birkin-2",
     "variants": [{"title": "Default Title", "price": "18500.00", "available": False}],
     "images": []},
    {"title": "Rolex Submariner", "vendor": "Rolex", "product_type": "Watches",
     "handle": "watches-rolex-submariner-3",
     "variants": [{"title": "Default Title", "price": "10750.00", "available": True}],
     "images": []},
    {"title": "Chanel Pearl Necklace", "vendor": "Chanel", "product_type": "Jewelry",
     "handle": "jewelry-chanel-pearl-necklace-6",
     "variants": [{"title": "Default Title", "price": "1500.00", "available": True}],
     "images": []},
]
REBAG = [
    {"title": "Chanel Boy Bag", "vendor": "Chanel", "product_type": "Handbags",
     "handle": "chanel-boy-bag-4",
     "variants": [{"title": "Very Good | Item # 435909/1 / green", "price": "4200.00",
                  "available": True}],
     "images": [{"src": "https://cdn.example/chanel-boy.jpg"}]},
    {"title": "Chanel Wallet", "vendor": "Chanel", "product_type": "Small Leather Goods",
     "handle": "chanel-wallet-5",
     "variants": [{"title": "Default Title", "price": "900.00", "available": True}],
     "images": []},
]
PAGES = {
    (DATASET_FASHIONPHILE, 1): FASHIONPHILE,
    (DATASET_REBAG, 1): REBAG,
}
#: The listing endpoint (/products/<handle>.js) is not the catalogue endpoint: it sends the
#: images as bare URL strings and calls the description "description". Live shape, 2026-09-30.
LISTINGS = {
    (DATASET_FASHIONPHILE, "handbags-chanel-classic-flap-1"): {
        **FASHIONPHILE[0],
        "images": ["https://cdn.example/chanel-flap.jpg"],
        "description": "<p>Black lambskin &amp; gold hardware.<br>Box &amp; dust bag.</p>",
    },
    (DATASET_REBAG, "chanel-boy-bag-4"): {
        **REBAG[0],
        "description": None,
    },
}


def catalogue_fetch(pages=None, listings=None, fail=()):
    """A fetch(url, params, headers) over canned storefront payloads. No network."""
    pages = PAGES if pages is None else pages
    listings = LISTINGS if listings is None else listings
    calls: list[dict] = []

    def fetch(url: str, params: dict, headers: dict):
        source = DATASET_FASHIONPHILE if "fashionphile" in url else DATASET_REBAG
        calls.append({"url": url, "params": dict(params), "source": source})
        if source in fail:
            raise UpstreamError(f"{source}: upstream is down")
        if url.endswith(".js"):
            handle = url.split("/products/", 1)[1][:-3]
            return listings.get((source, handle)) or {}
        return {"products": pages.get((source, int(params.get("page", 1))), [])}

    return fetch, calls


def client(**kwargs) -> ResaleClient:
    fetch, calls = catalogue_fetch(**kwargs)
    client = ResaleClient(fetch=fetch, cache_ttl=0, timeout=5)
    return client, calls


INDEX_PAYLOAD = {
    "brands": [
        {"brand": "chanel", "count": 3, "available": 3, "median": 4200.0, "low": 900.0,
         "high": 6500.0, "sources": [DATASET_FASHIONPHILE, DATASET_REBAG]},
        {"brand": "gucci", "count": 8, "available": 5, "median": 1250.0, "low": 300.0,
         "high": 3900.0, "sources": [DATASET_REBAG]},
        {"brand": "prada", "count": 4, "available": 2, "median": 1800.0, "low": 700.0,
         "high": 2600.0, "sources": [DATASET_FASHIONPHILE]},
    ],
    "scanned": 1000,
    "dearest": {"brand": "chanel", "median": 4200.0},
    "cheapest": {"brand": "gucci", "median": 1250.0},
    "mostListed": {"brand": "gucci", "count": 8},
}

DENIED_TEXT = ("`resale_price_index` is a premium tool, but that licence key has expired. "
               "Get a key at https://buy.polar.sh/polar_cl_example")
TOOL_ERROR_TEXT = "`resale_price_index` failed: that brand is not in the catalogue"


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
            return {"jsonrpc": "2.0", "id": 1,
                    "result": {"content": [{"type": "text", "text": DENIED_TEXT}],
                               "structuredContent": {"licenceRefusal": True, "reason": "expired"},
                               "isError": True}}
        body = text if text is not None else json.dumps(payload)
        return {"jsonrpc": "2.0", "id": 1, "result": {"content": [{"type": "text", "text": body}]}}

    return GatewayClient(fetch=fetch, key=key), calls


def message(text: str, **data) -> dict:
    parts: list[dict] = [{"kind": "text", "text": text}]
    if data:
        parts.append({"kind": "data", "data": data})
    return {"kind": "message", "role": "user", "messageId": "m", "parts": parts}


class HelperTests(unittest.TestCase):
    def test_money_reads_the_strings_shopify_sends(self):
        self.assertEqual(money("6500.00"), 6500.0)
        self.assertEqual(money(900), 900.0)
        self.assertIsNone(money("free"))
        self.assertIsNone(money(None))
        self.assertIsNone(money("-5"))

    def test_only_rebag_writes_a_condition_into_the_variant_title(self):
        self.assertEqual(condition_from_variant("Very Good | Item # 435909/1 / green"), "very good")
        self.assertIsNone(condition_from_variant("Default Title"))
        self.assertIsNone(condition_from_variant("Mint | whatever"))  # not one of Rebag's words
        self.assertIsNone(condition_from_variant(None))

    def test_a_brand_is_recognised_by_any_of_its_spellings(self):
        for spelling in ("Chanel", "chanel", "chanel "):
            self.assertEqual(brand_key(spelling), "chanel")
        self.assertEqual(brand_key("Christian Dior"), "dior")
        self.assertEqual(brand_key("Tiffany & Co."), "tiffany")
        self.assertEqual(brand_key("Some Other Label"), "some other label")

    def test_brands_in_text_is_ordered_and_exact(self):
        self.assertEqual(brands_in_text("compare chanel, gucci and prada"),
                         ["chanel", "gucci", "prada"])
        # 'lv' and 'ysl' are aliases; 'guccis' is not a brand.
        self.assertEqual(brands_in_text("lv or ysl?"), ["saint laurent", "louis vuitton"])
        self.assertEqual(brands_in_text("guccis are nice"), [])

    def test_plain_text_strips_tags_and_entities(self):
        self.assertEqual(plain_text("<p>Black &amp; gold</p>"), "Black & gold")
        self.assertIsNone(plain_text(""))
        self.assertIsNone(plain_text(None))
        self.assertLessEqual(len(plain_text("<p>" + "x" * 900 + "</p>")), 600)

    def test_usd_never_invents_a_number(self):
        self.assertEqual(usd(6500), "$6,500")
        self.assertEqual(usd(None), "price not reported")

    def test_singular_only_touches_likely_plurals(self):
        self.assertEqual(singular("watches"), "watch")
        self.assertEqual(singular("necklaces"), "necklace")
        self.assertEqual(singular("wallets"), "wallet")
        self.assertEqual(singular("dresses"), "dress")
        self.assertEqual(singular("kilt"), "kilt")
        # A four-letter word is left alone: too short to know whether the s belongs to it.
        self.assertEqual(singular("bags"), "bags")


class RouteTests(unittest.TestCase):
    def test_a_price_question_about_one_piece_is_a_search(self):
        skill, params = route("what does a chanel flap cost?")
        self.assertEqual(skill, SKILL_SEARCH)
        self.assertEqual(params["brand"], "chanel")
        self.assertEqual(params["keyword"], "flap")

    def test_a_market_word_without_a_narrowing_word_is_the_market_read(self):
        skill, params = route("what does the chanel market look like right now")
        self.assertEqual(skill, SKILL_MARKET)
        self.assertEqual(params["brand"], "chanel")

    def test_a_brand_with_a_market_word_is_a_market_read(self):
        skill, params = route("what is the chanel market like right now?")
        self.assertEqual(skill, SKILL_MARKET)
        self.assertEqual(params["brand"], "chanel")

    def test_a_product_url_is_a_listing(self):
        skill, params = route("https://shop.rebag.com/products/chanel-boy-bag-4")
        self.assertEqual(skill, SKILL_PIECE)
        self.assertEqual(params["handle"], "chanel-boy-bag-4")
        self.assertEqual(params["source"], DATASET_REBAG)

    def test_the_word_listing_points_at_a_handle(self):
        skill, params = route("pull the listing handbags-hermes-maxibox-bag-294167871")
        self.assertEqual(skill, SKILL_PIECE)
        self.assertEqual(params["handle"], "handbags-hermes-maxibox-bag-294167871")

    def test_several_brands_being_compared_is_the_premium_index(self):
        skill, params = route("compare chanel, gucci and prada")
        self.assertEqual(skill, SKILL_INDEX)
        self.assertEqual(params["brands"], ["chanel", "gucci", "prada"])

    def test_two_brands_without_a_compare_word_stay_a_search(self):
        # "which is dearer, chanel or gucci" is a question about one brand's prices, not an index.
        skill, _ = route("show me chanel gucci")
        self.assertEqual(skill, SKILL_SEARCH)

    def test_help_and_empty_messages_route_to_help(self):
        self.assertEqual(route("")[0], SKILL_HELP)
        self.assertEqual(route("what can you do?")[0], SKILL_HELP)


class ParseTests(unittest.TestCase):
    def test_a_plain_question_routes_by_its_words(self):
        parsed = parse(message("what does a chanel flap cost?"))
        self.assertEqual(parsed["skill"], SKILL_SEARCH)
        self.assertEqual(parsed["params"]["brand"], "chanel")
        self.assertEqual(parsed["params"]["keyword"], "flap")
        self.assertTrue(parsed["explicit"])

    def test_a_named_skill_in_the_data_wins(self):
        parsed = parse(message("ignore me", skill=SKILL_MARKET, brand="rolex"))
        self.assertEqual(parsed["skill"], SKILL_MARKET)
        self.assertEqual(parsed["params"]["brand"], "rolex")

    def test_brands_arrive_as_a_list_or_a_comma_separated_string(self):
        as_list = parse(message("compare these", skill=SKILL_INDEX, brands=["chanel", "rolex"]))
        self.assertEqual(as_list["params"]["brands"], ["chanel", "rolex"])
        as_text = parse(message("compare these", skill=SKILL_INDEX, brands="chanel, rolex"))
        self.assertEqual(as_text["params"]["brands"], ["chanel", "rolex"])

    def test_a_handle_in_a_data_part_needs_no_prose(self):
        parsed = parse({"parts": [{"kind": "data", "data": {"handle": "chanel-boy-bag-4"}}]})
        self.assertEqual(parsed["skill"], SKILL_PIECE)
        self.assertEqual(parsed["params"]["handle"], "chanel-boy-bag-4")

    def test_a_bare_follow_up_is_not_explicit(self):
        # A one-word answer to "which brand?" must not look like a fresh question.
        parsed = parse(message("chanel"))
        self.assertEqual(parsed["params"]["brand"], "chanel")
        self.assertFalse(parsed["explicit"])

    def test_a_bare_handle_is_an_answer_not_a_search(self):
        # piece-lookup asks "which listing?" and the caller pastes just the handle back.
        parsed = parse(message("chanel-caviar-quilted-flap-beige-1979023"))
        self.assertEqual(parsed["skill"], SKILL_PIECE)
        self.assertEqual(parsed["params"]["handle"], "chanel-caviar-quilted-flap-beige-1979023")
        self.assertFalse(parsed["explicit"])

    def test_an_empty_message_is_routed_and_not_explicit(self):
        parsed = parse({"parts": [{"kind": "text", "text": ""}]})
        self.assertEqual(parsed["skill"], SKILL_HELP)
        self.assertFalse(parsed["explicit"])

    def test_the_index_never_gets_more_than_four_brands(self):
        parsed = parse(message("compare them", skill=SKILL_INDEX,
                               brands=["chanel", "gucci", "prada", "rolex", "hermes"]))
        self.assertEqual(len(parsed["params"]["brands"]), 4)


class SearchTests(unittest.TestCase):
    def test_a_brand_search_is_cheapest_first_across_both_stores(self):
        data, calls = client()
        result = run_search({"brand": "chanel", "limit": 12}, data)
        self.assertEqual(result["final_state"], "completed")
        rows = result["artifact"]["rows"]
        self.assertEqual([row["price"] for row in rows], [900.0, 1500.0, 4200.0, 6500.0])
        self.assertEqual(result["artifact"]["sources"], [DATASET_FASHIONPHILE, DATASET_REBAG])
        self.assertEqual(result["artifact"]["read"], 6)
        self.assertEqual(result["artifact"]["count"], 4)
        self.assertTrue(all(row["url"].startswith("https://") for row in rows))
        self.assertIn("Cheapest matches for chanel", result["message"])
        self.assertIn("asking prices", result["message"])

    def test_a_keyword_filters_on_the_title_and_the_type(self):
        data, _ = client()
        result = run_search({"brand": None, "keyword": "submariner", "limit": 5}, data)
        self.assertEqual([row["handle"] for row in result["artifact"]["rows"]],
                         ["watches-rolex-submariner-3"])

    def test_a_plural_ask_is_retried_singular(self):
        data, _ = client()
        result = run_search({"brand": "chanel", "keyword": "necklaces", "limit": 5}, data)
        rows = result["artifact"]["rows"]
        self.assertEqual([row["handle"] for row in rows], ["jewelry-chanel-pearl-necklace-6"])
        self.assertEqual(result["artifact"]["keyword"], "necklace")

    def test_rebag_reports_a_condition_and_fashionphile_says_so(self):
        data, _ = client()
        result = run_search({"brand": "chanel", "limit": 12}, data)
        by_handle = {row["handle"]: row for row in result["artifact"]["rows"]}
        self.assertEqual(by_handle["chanel-boy-bag-4"]["condition"], "very good")
        self.assertIsNone(by_handle["handbags-chanel-classic-flap-1"]["condition"])
        self.assertIn("condition: not reported", result["message"])

    def test_sold_listings_stay_listed_and_are_marked(self):
        data, _ = client()
        result = run_search({"brand": "hermes", "limit": 5}, data)
        row = result["artifact"]["rows"][0]
        self.assertFalse(row["available"])
        self.assertIn("sold, still listed", result["message"])

    def test_a_word_that_matches_nothing_is_answered_honestly(self):
        data, _ = client()
        result = run_search({"brand": None, "keyword": "helicopter", "limit": 5}, data)
        self.assertEqual(result["final_state"], "completed")
        self.assertEqual(result["artifact"]["rows"], [])
        self.assertIn("not an outage", result["message"])

    def test_nothing_to_search_for_asks_for_something(self):
        data, _ = client()
        result = run_search({"brand": None, "keyword": None}, data)
        self.assertEqual(result["final_state"], "input-required")
        self.assertIsNone(result["artifact"])

    def test_the_limit_and_the_page_count_are_clamped(self):
        data, calls = client()
        run_search({"brand": "chanel", "keyword": None, "limit": 999}, data)
        pages = {call["params"].get("page") for call in calls}
        self.assertEqual(pages, {"1", "2"})
        self.assertTrue(all(call["params"]["limit"] == "250" for call in calls))

    def test_one_store_being_down_still_answers_from_the_other(self):
        data, _ = client(fail=(DATASET_REBAG,))
        result = run_search({"brand": "chanel", "limit": 5}, data)
        self.assertEqual(result["final_state"], "completed")
        self.assertEqual(result["artifact"]["sources"], [DATASET_FASHIONPHILE])
        self.assertEqual([row["price"] for row in result["artifact"]["rows"]], [1500.0, 6500.0])

    def test_both_stores_being_down_is_a_failed_task(self):
        data, _ = client(fail=(DATASET_FASHIONPHILE, DATASET_REBAG))
        with self.assertRaises(UpstreamError):
            run_search({"brand": "chanel", "keyword": None, "limit": 5}, data)

    def test_the_agent_turns_an_outage_into_a_failed_task(self):
        agent = ResaleAgent(client=client(fail=(DATASET_FASHIONPHILE, DATASET_REBAG))[0],
                            gateway=fake_gateway(INDEX_PAYLOAD)[0])
        result = agent.run({"skill": SKILL_SEARCH, "params": {"brand": "chanel", "keyword": None},
                            "missing": []})
        self.assertEqual(result["final_state"], "failed")
        self.assertIn("could not read the resale catalogues", result["message"])


class MarketTests(unittest.TestCase):
    def test_the_market_read_counts_states_and_measures_the_spread(self):
        data, _ = client()
        result = run_market({"brand": "chanel"}, data)
        artifact = result["artifact"]
        self.assertEqual(result["final_state"], "completed")
        self.assertEqual(artifact["count"], 4)
        self.assertEqual(artifact["available"], 4)
        self.assertEqual(artifact["listed"], 0)
        self.assertEqual(artifact["priced"], 4)
        self.assertEqual((artifact["low"], artifact["median"], artifact["high"]),
                         (900.0, 2850.0, 6500.0))
        self.assertEqual(artifact["conditions"], {"very good": 1})
        self.assertEqual(artifact["types"]["Handbags"], 2)
        self.assertEqual(artifact["by_source"],
                         {DATASET_FASHIONPHILE: 2, DATASET_REBAG: 2})
        self.assertIn("median $2,850", result["message"])

    def test_a_brand_with_nothing_listed_is_not_dressed_up_as_a_market(self):
        data, _ = client()
        result = run_market({"brand": "balenciaga"}, data)
        self.assertEqual(result["final_state"], "completed")
        self.assertEqual(result["artifact"]["count"], 0)
        self.assertIn("will not guess a market from an empty page", result["message"])

    def test_no_brand_asks_for_one(self):
        data, _ = client()
        result = run_market({"brand": None}, data)
        self.assertEqual(result["final_state"], "input-required")

    def test_pages_are_clamped_to_the_maximum(self):
        data, calls = client()
        run_market({"brand": "chanel", "pages": 99}, data)
        pages = {int(call["params"]["page"]) for call in calls}
        # Asked for 99, so the read stops at the page cap — and at the first empty page.
        self.assertTrue(pages <= set(range(1, MAX_PAGES + 1)), sorted(pages))
        self.assertIn(1, pages)
        self.assertGreaterEqual(len(pages), 2)


class PieceTests(unittest.TestCase):
    def test_a_listing_comes_back_with_the_stores_own_fields(self):
        data, _ = client()
        result = run_piece({"handle": "handbags-chanel-classic-flap-1",
                            "source": DATASET_FASHIONPHILE}, data)
        artifact = result["artifact"]
        self.assertEqual(result["final_state"], "completed")
        self.assertEqual(artifact["title"], "Chanel Classic Flap")
        self.assertEqual(artifact["price"], 6500.0)
        self.assertTrue(artifact["available"])
        self.assertEqual(artifact["dataset"], DATASET_FASHIONPHILE)
        self.assertIn("Black lambskin & gold hardware.", artifact["description"])
        self.assertEqual(artifact["image"], "https://cdn.example/chanel-flap.jpg")
        self.assertIn("$6,500", result["message"])

    def test_a_handle_is_tried_on_the_other_store_when_the_first_misses(self):
        data, calls = client()
        result = run_piece({"handle": "chanel-boy-bag-4", "source": None}, data)
        self.assertEqual(result["artifact"]["dataset"], DATASET_REBAG)
        self.assertEqual([call["source"] for call in calls], [DATASET_FASHIONPHILE, DATASET_REBAG])
        self.assertEqual(result["artifact"]["condition"], "very good")
        self.assertIn("Source: Rebag", result["message"])

    def test_a_handle_no_store_has_is_a_failed_task(self):
        data, _ = client()
        with self.assertRaises(UpstreamError):
            run_piece({"handle": "handbags-nobody-has-this-9", "source": None}, data)

    def test_an_impossible_handle_is_rejected_before_any_request(self):
        data, calls = client()
        with self.assertRaises(ValueError):
            run_piece({"handle": "a", "source": None}, data)
        self.assertEqual(calls, [])

    def test_no_handle_asks_for_one(self):
        data, _ = client()
        result = run_piece({"handle": None, "source": None}, data)
        self.assertEqual(result["final_state"], "input-required")


class IndexTests(unittest.TestCase):
    """The premium skill: routing stays local, the index comes from the gateway."""

    def test_the_index_is_reported_from_the_gateways_numbers(self):
        gateway, calls = fake_gateway(INDEX_PAYLOAD)
        data, _ = client()
        result = run_index({"brands": ["chanel", "gucci", "prada"]}, data, gateway)
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("chanel: 3 listings (3 available), median $4,200", result["message"])
        self.assertIn("Highest median asking price: chanel at $4,200", result["message"])
        self.assertIn("Most listings: gucci with 8", result["message"])
        self.assertTrue(result["artifact"]["premium"])
        self.assertEqual(len(result["artifact"]["brands"]), 3)
        # The gateway did the work: one call, with the brands and pages it reads.
        self.assertEqual(len(calls), 1)
        sent = calls[0]["payload"]["params"]
        self.assertEqual(sent["name"], PREMIUM_TOOL)
        self.assertEqual(sent["arguments"], {"brands": ["chanel", "gucci", "prada"], "pages": 2})
        self.assertTrue(calls[0]["headers"]["Authorization"].startswith("Bearer "))

    def test_a_denied_key_is_an_answer_with_the_gateways_wording(self):
        gateway, _ = fake_gateway()
        data, calls = client()
        result = run_index({"brands": ["chanel", "gucci"]}, data, gateway)
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("premium tool", result["message"])
        self.assertIn("buy.polar.sh", result["message"])
        self.assertTrue(result["artifact"]["premium"])
        self.assertNotIn("brands", result["artifact"])
        # The catalogues were never read: the numbers only exist behind the gate.
        self.assertEqual(calls, [])

    def test_a_missing_key_is_an_answer_too_and_says_which_variable(self):
        gateway, _ = fake_gateway(key="")
        data, _ = client()
        result = run_index({"brands": ["chanel", "gucci"]}, data, gateway)
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("MCP_LICENSE_KEY", result["message"])
        self.assertTrue(result["artifact"]["premium"])

    def test_a_gateway_that_cannot_be_reached_is_a_failed_task(self):
        gateway, _ = fake_gateway(error=UpstreamError("connection refused"))
        data, _ = client()
        result = run_index({"brands": ["chanel", "gucci"]}, data, gateway)
        self.assertEqual(result["final_state"], "failed")
        self.assertIn("could not be reached", result["message"])

    def test_a_tool_error_after_the_gate_is_not_dressed_up_as_a_licence_problem(self):
        gateway, _ = fake_gateway(tool_error=TOOL_ERROR_TEXT)
        data, _ = client()
        result = run_index({"brands": ["chanel", "gucci"]}, data, gateway)
        self.assertEqual(result["final_state"], "failed")
        self.assertIn("not in the catalogue", result["message"])

    def test_an_empty_index_answer_is_not_reported_as_prices(self):
        gateway, _ = fake_gateway({"brands": [], "scanned": 0})
        data, _ = client()
        result = run_index({"brands": ["chanel", "gucci"]}, data, gateway)
        self.assertEqual(result["final_state"], "failed")
        self.assertIn("nothing to report", result["message"])

    def test_fewer_than_two_brands_asks_for_more(self):
        gateway, calls = fake_gateway(INDEX_PAYLOAD)
        data, _ = client()
        result = run_index({"brands": ["chanel"]}, data, gateway)
        self.assertEqual(result["final_state"], "input-required")
        self.assertEqual(calls, [])

    def test_the_index_sends_at_most_four_brands(self):
        gateway, calls = fake_gateway(INDEX_PAYLOAD)
        data, _ = client()
        run_index({"brands": ["chanel", "gucci", "prada", "rolex", "hermes"]}, data, gateway)
        self.assertEqual(calls[0]["payload"]["params"]["arguments"]["brands"],
                         ["chanel", "gucci", "prada", "rolex"])

    def test_the_agent_never_reads_the_catalogues_for_the_premium_skill(self):
        gateway, calls = fake_gateway(INDEX_PAYLOAD)
        data, _ = client()
        agent = ResaleAgent(client=data, gateway=gateway)
        result = agent.run({"skill": SKILL_INDEX, "params": {"brands": ["chanel", "gucci"]},
                            "missing": []})
        self.assertEqual(result["final_state"], "completed")


class AgentTests(unittest.TestCase):
    def agent(self) -> ResaleAgent:
        return ResaleAgent(client=client()[0], gateway=fake_gateway(INDEX_PAYLOAD)[0])

    def test_the_card_lists_every_skill_in_order(self):
        skills = [skill["id"] for skill in ResaleAgent.card_skills]
        self.assertEqual(skills, list(SKILLS))
        self.assertEqual(ResaleAgent.datasets, (DATASET_FASHIONPHILE, DATASET_REBAG))
        self.assertEqual(ResaleAgent.watch_kinds, ())

    def test_a_missing_parameter_asks_instead_of_guessing(self):
        result = self.agent().run({"skill": SKILL_MARKET, "params": {}, "missing": ["a brand"]})
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("Which brand's market?", result["message"])

    def test_the_search_prompt_names_the_examples(self):
        result = self.agent().run({"skill": SKILL_SEARCH, "params": {}, "missing": ["x"]})
        self.assertEqual(result["final_state"], "input-required")
        self.assertIn("chanel flap", result["message"])

    def test_help_lists_the_skills_and_the_two_catalogues(self):
        result = self.agent().run({"skill": SKILL_HELP, "params": {}, "missing": []})
        self.assertEqual(result["final_state"], "completed")
        self.assertIn("Fashionphile and Rebag", result["message"])
        self.assertIn("never estimate a price", result["message"])
        self.assertEqual(result["artifact"]["skills"], list(SKILLS))

    def test_a_full_question_runs_end_to_end(self):
        agent = self.agent()
        parsed = agent.parse(message("what is the chanel market like right now?"))
        request = {"skill": parsed["skill"], "params": parsed["params"],
                   "missing": agent.missing(parsed["skill"], parsed["params"])}
        result = agent.run(request)
        self.assertEqual(result["final_state"], "completed")
        self.assertEqual(result["artifact"]["brand"], "chanel")
        self.assertIn(result["artifact"]["dataset"][0], DATASETS)

    def test_every_free_skill_names_the_catalogues_as_its_dataset(self):
        agent = self.agent()
        for params in ({"brand": "chanel", "keyword": None},
                       {"brand": "chanel", "pages": 1},
                       {"handle": "chanel-boy-bag-4", "source": None}):
            skill = SKILL_SEARCH if "keyword" in params else (
                SKILL_MARKET if "pages" in params else SKILL_PIECE)
            result = agent.run({"skill": skill, "params": params, "missing": []})
            dataset = result["artifact"]["dataset"]
            cited = dataset if isinstance(dataset, list) else [dataset]
            self.assertTrue(set(cited) <= set(DATASETS), f"{skill}: {cited}")


if __name__ == "__main__":
    unittest.main(verbosity=2)
