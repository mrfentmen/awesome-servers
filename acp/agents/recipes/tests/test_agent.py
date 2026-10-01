"""Tests for the recipes agent: one dish, one ingredient, one country, routing and turns.

    python3 agents/recipes/tests/test_agent.py

No network: the JSON is injected, shaped like the live payloads read on 2026-09-28
(`/search.php?s=chicken` -> 'Chicken Handi' id 52959 with 20 ingredient slots; `/lookup.php?
i=52771` -> 'Spicy Arrabiata Penne', Italian, Vegetarian, strSource null; `/filter.php?a=Italian`
-> 21 meals carrying only id, name, thumbnail and country).
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

from acp_kit import (AcpClient, Connection, GatewayClient,  # noqa: E402
                     STOP_END_TURN, STOP_REFUSAL)

from agent import route  # noqa: E402
from data import RecipesData, RecipesError, RecipesNotFound  # noqa: E402


def meal(meal_id, name, area, category, ingredients, instructions, source=None):
    record = {"idMeal": meal_id, "strMeal": name, "strArea": area, "strCategory": category,
              "strMealThumb": f"https://www.themealdb.com/images/media/meals/{meal_id}.jpg",
              "strTags": "", "strInstructions": instructions, "strSource": source,
              "strYoutube": "", "strCountry": area or ""}
    for slot in range(1, 21):
        record[f"strIngredient{slot}"] = ingredients[slot - 1][0] if slot <= len(ingredients) else ""
        record[f"strMeasure{slot}"] = ingredients[slot - 1][1] if slot <= len(ingredients) else ""
    return record


#: strSource is null on plenty of real recipes, and has to stay unreported.
PENNE = meal(
    "52771", "Spicy Arrabiata Penne", "Italian", "Vegetarian",
    [("penne rigate", "200g"), ("olive oil", "1 tbsp"), ("onion", "1")],
    "Boil the pasta. Meanwhile fry the garlic and onion in the olive oil.",
    source=None)

#: 'Chicken Handi', as the live search answered, minus the eight empty ingredient slots.
HANDI = meal(
    "52959", "Chicken Handi", "Indian", "Chicken",
    #: (ingredient, measure), the order the helper fills the 20 slots in.
    [("Chicken", "1.2 kg"), ("thinly sliced Onion", "5"), ("finely chopped Tomatoes", "2"),
     ("chopped Garlic", "8 cloves"), ("Ginger paste", "1 tbsp"), ("Yogurt", "1 cup")],
    "Take a large pot or wok, and heat the oil in it. Once the oil is hot, add sliced onion "
    "and fry them until deep golden brown. Then add the chopped garlic and saute for a minute.",
    source="https://www.desi-chloride.com/chicken-handi/")

#: strSource is null on plenty of real recipes, and has to stay unreported.
Penne = meal(
    "52771", "Spicy Arrabiata Penne", "Italian", "Vegetarian",
    [("penne rigate", "200g"), ("olive oil", "1 tbsp"), ("onion", "1")],
    "Boil the pasta. Meanwhile fry the garlic and onion in the olive oil.",
    source=None)

#: `filter.php` answers names and ids only - no ingredients, no method.
FILTER_ROWS = {"meals": [
    {"strMeal": "Belgian Waterzooi Chicken", "idMeal": "53466", "strArea": None,
     "strCountry": "Belgium", "strMealThumb": "https://thumb/53466.jpg"},
    {"strMeal": "Chick-Fil-A Sandwich", "idMeal": "53016", "strArea": "United States",
     "strCountry": "United States", "strMealThumb": "https://thumb/53016.jpg"},
]}

AREAS = {"meals": [{"strArea": "Indian"}, {"strArea": "Italian"}, {"strArea": "United States"}]}
CATEGORIES = {"meals": [{"strCategory": "Chicken"}, {"strCategory": "Vegetarian"},
                        {"strCategory": "Pasta"}]}


class FakeFeeds:
    def __init__(self, search=None, lookup=None, filter_rows=None, areas=None,
                 categories=None, empty=False, fail=False):
        self.calls: list[str] = []
        self.search = search if search is not None else [HANDI, PENNE]
        self.lookup = lookup if lookup is not None else {
            "52771": PENNE, "52959": HANDI,
            "53466": meal("53466", "Belgian Waterzooi Chicken", "Belgian", "Chicken",
                          [("1 kg", "chicken"), ("1 l", "water"), ("1", "onion")],
                          "Cook the chicken in the water with the onion for an hour."),
            "53016": meal("53016", "Chick-Fil-A Sandwich", "American", "Chicken",
                          [("1", "chicken breast"), ("1", "bun")],
                          "Grill the chicken and put it in the bun.")}
        self.filter_rows = filter_rows if filter_rows is not None else FILTER_ROWS
        self.areas = areas if areas is not None else AREAS
        self.categories = categories if categories is not None else CATEGORIES
        self.empty = empty
        self.fail = fail

    def __call__(self, url: str):
        self.calls.append(url)
        if self.fail:
            raise RecipesError("TheMealDB is unreachable")
        if self.empty:
            return json.dumps({"meals": None})
        if "list.php?a=list" in url:
            return json.dumps(self.areas)
        if "list.php?c=list" in url:
            return json.dumps(self.categories)
        if "/search.php" in url:
            #: The real search matches on the dish name, so the fake does too.
            query = url.split("s=", 1)[-1].replace("%20", " ").lower()
            hit = [row for row in self.search if query.split()[-1] in row["strMeal"].lower()]
            return json.dumps({"meals": hit or None})
        if "/filter.php" in url:
            return json.dumps(self.filter_rows)
        if "/lookup.php" in url:
            wanted = url.rsplit("=", 1)[-1]
            if wanted in self.lookup:
                return json.dumps({"meals": [self.lookup[wanted]]})
            return json.dumps({"meals": None})
        raise RecipesError(f"unexpected url in test: {url}")


def make_data(**kw):
    feed = FakeFeeds(**kw)
    return RecipesData(fetch=feed), feed


class ReadTests(unittest.TestCase):
    def test_one_dish_by_name(self):
        data, feed = make_data()
        found = data.by_name("chicken handi", limit=1)
        self.assertEqual(found[0]["name"], "Chicken Handi")
        self.assertEqual(found[0]["area"], "Indian")
        self.assertEqual(found[0]["category"], "Chicken")
        self.assertEqual(len(found[0]["ingredients"]), 6)
        self.assertEqual(found[0]["ingredients"][0], {"ingredient": "Chicken", "measure": "1.2 kg"})
        self.assertIn("search.php?s=chicken%20handi", feed.calls[0])

    def test_a_recipe_with_no_published_source_says_so(self):
        data, _feed = make_data()
        penne = data.meal("52771")
        self.assertEqual(penne["name"], "Spicy Arrabiata Penne")
        self.assertIsNone(penne["source"])
        self.assertEqual(penne["tags"], [])

    def test_a_filter_is_looked_up_in_full_for_every_name(self):
        data, feed = make_data()
        meals = data.by_ingredient("chicken_breast", limit=2)
        self.assertEqual([row["name"] for row in meals],
                         ["Belgian Waterzooi Chicken", "Chick-Fil-A Sandwich"])
        #: The lookup decides the area, because the filter rows carry none for one of them.
        self.assertEqual([row["area"] for row in meals], ["Belgian", "American"])
        #: filter.php carries no ingredients, so each row costs a lookup. The names come from
        #: the filter, the ingredients from the lookup - the two are not confused.
        self.assertEqual(feed.calls[0], "https://www.themealdb.com/api/json/v1/1/filter.php?i=chicken_breast")
        self.assertIn("lookup.php?i=53466", feed.calls[1])
        self.assertTrue(meals[0]["ingredients"])

    def test_recipes_by_area_and_the_areas_list(self):
        data, feed = make_data()
        meals = data.by_area("Italian", limit=2)
        self.assertEqual(len(meals), 2)
        self.assertIn("filter.php?a=Italian", feed.calls[0])
        self.assertEqual(data.areas(), ["Indian", "Italian", "United States"])
        self.assertEqual(data.categories(), ["Chicken", "Vegetarian", "Pasta"])

    def test_nothing_found_and_a_dead_api(self):
        data, _feed = make_data(empty=True)
        with self.assertRaises(RecipesNotFound):
            data.by_name("chicken handi")
        with self.assertRaises(RecipesNotFound):
            data.areas()
        data, _feed = make_data(fail=True)
        with self.assertRaises(RecipesError):
            data.by_name("chicken handi")
        data, _feed = make_data()
        with self.assertRaises(ValueError):
            data.by_name("   ")


class RouteTests(unittest.TestCase):
    def test_a_dish_an_ingredient_and_a_country(self):
        self.assertEqual(route("how do I cook chicken handi?"),
                         ("recipes-by-name", {"query": "chicken handi"}))
        self.assertEqual(route("recipe for Spicy Arrabiata Penne"),
                         ("recipes-by-name", {"query": "Spicy Arrabiata Penne"}))
        self.assertEqual(route("what can I make with chicken breast?"),
                         ("recipes-by-ingredient", {"query": "chicken breast"}))
        self.assertEqual(route("what do Italians eat?"),
                         ("recipes-by-area", {"query": "what do Italians eat?"}))
        self.assertEqual(route("what areas do you have?"), ("recipes-list", {}))

    def test_a_cupboard_question_goes_to_the_premium_skill(self):
        self.assertEqual(
            route("I have chicken, rice and coconut milk in the cupboard, what can I make?"),
            ("recipes-pantry", {"ingredients": ["chicken", "rice", "coconut milk"]}))
        self.assertEqual(route("I only have bread and butter, what should I cook?"),
                         ("recipes-pantry", {"ingredients": ["bread", "butter"]}))

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
        from agent import RecipesAgent

        agent_conn, client_conn = connected_pair()
        data, feed = make_data(**kw)
        agent = RecipesAgent(agent_conn, data)
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission=permission)
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            return client.prompt(text, session_id), client, feed
        finally:
            client.stop()

    def test_a_recipe_answer(self):
        result, client, _ = self.turn("how do I cook chicken handi?")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertEqual(len(client.permission_requests), 1)
        self.assertIn("Chicken Handi", result["text"])
        self.assertIn("Indian / Chicken", result["text"])
        self.assertIn("6 ingredient(s):", result["text"])
        self.assertIn("1.2 kg Chicken", result["text"])
        self.assertIn("Take a large pot or wok", result["text"])
        self.assertIn("source: https://www.desi-chloride.com/chicken-handi/", result["text"])

    def test_a_recipe_with_no_source_says_not_published(self):
        result, _, _ = self.turn("recipe for Spicy Arrabiata Penne")
        self.assertIn("Spicy Arrabiata Penne", result["text"])
        self.assertIn("source: not published by TheMealDB", result["text"])

    def test_an_ingredient_answer_lists_then_shows_one(self):
        result, _, _ = self.turn("what can I make with chicken breast?")
        self.assertIn("2 recipe(s) using 'chicken breast'", result["text"])
        self.assertIn("1. Belgian Waterzooi Chicken", result["text"])
        self.assertIn("full method for the first one", result["text"])

    def test_an_area_answer_and_an_unknown_area(self):
        result, _, _ = self.turn("what do Italians eat?")
        self.assertIn("2 recipe(s) from Italian", result["text"])
        result, _, _ = self.turn("what do Martians eat?")
        self.assertIn("I could not tell which country that is", result["text"])
        self.assertIn("Indian, Italian, United States", result["text"])

    def test_the_areas_list(self):
        result, _, _ = self.turn("what areas do you have?")
        self.assertIn("3 area(s) and 3 category(ies)", result["text"])
        self.assertIn("areas: Indian, Italian, United States", result["text"])

    def test_help_asks_nothing(self):
        result, client, feed = self.turn("what can you do?")
        self.assertIn("TheMealDB", result["text"])
        self.assertEqual(client.permission_requests, [])
        self.assertEqual(feed.calls, [])

    def test_permission_denied_and_a_dead_api(self):
        result, _, _ = self.turn("how do I cook chicken handi?", permission="reject")
        self.assertEqual(result["stopReason"], STOP_REFUSAL)
        result, _, _ = self.turn("how do I cook chicken handi?", fail=True)
        self.assertIn("I could not read TheMealDB", result["text"])


# ---------------------------------------------------------------------------
# The premium skill: recipes-pantry
#
# No network: the licence check and the work both happen on the gateway, and the
# gateway's own JSON-RPC answers are injected into the real GatewayClient.
# ---------------------------------------------------------------------------

#: What `recipes_pantry_match` answers for chicken, rice and coconut milk.
PANTRY_DATA = {
    "youHave": ["chicken", "rice", "coconut milk"],
    "maxMissing": 3,
    "candidatesConsidered": 47,
    "recipesFound": 2,
    "recipes": [
        {
            "name": "Thai coconut chicken",
            "area": "Thai", "category": "Chicken",
            "youHave": ["Chicken", "Coconut Milk", "Rice"],
            "stillNeeded": [{"ingredient": "Lemongrass", "measure": "1 stalk"},
                            {"ingredient": "Fish Sauce", "measure": "2 tbsp"}],
            "shoppingList": ["1 stalk Lemongrass", "2 tbsp Fish Sauce"],
            "instructions": "Simmer the chicken in the coconut milk with the lemongrass.",
            "thumbnail": "https://www.themealdb.com/images/media/meals/53060.jpg",
            "source": None,
        },
        {
            "name": "Chicken Biryani",
            "area": "Indian", "category": "Chicken",
            "youHave": ["Chicken", "Rice"],
            "stillNeeded": [{"ingredient": "Basmati Rice", "measure": "300 g"}],
            "shoppingList": ["300 g Basmati Rice"],
            "instructions": "Layer the rice and the chicken and cook.",
            "thumbnail": None,
            "source": "https://www.bbcgoodfood.com/recipes/biryani",
        },
    ],
    "source": "TheMealDB (themealdb.com)",
}

#: The exact refusal the gateway sends for a key it will not accept.
GATEWAY_DENIAL = ("`recipes_pantry_match` is a premium tool, but that licence key was rejected. "
                  "Check MCP_LICENSE_KEY, or get a key at https://polar.sh/mrfentmen")


def gateway_answer(text, is_error=False, structured=None):
    """A fake transport that answers every premium call with one JSON-RPC reply."""
    def fetch(url, payload, headers):
        fetch.calls.append({"url": url, "payload": payload, "headers": headers})
        result = {"content": [{"type": "text", "text": text}]}
        if is_error:
            result["isError"] = True
        if structured is not None:
            result["structuredContent"] = structured
        return {"jsonrpc": "2.0", "id": payload.get("id", 1), "result": result}

    fetch.calls = []
    return fetch


class PremiumTests(unittest.TestCase):
    """No key, a bad key and a good key, plus the routing that gets there."""

    def turn(self, text: str, fetch, key: str, **kw):
        from agent import RecipesAgent

        agent_conn, client_conn = connected_pair()
        data, _feed = make_data(**kw)
        gateway = GatewayClient(fetch=fetch, key=key, url="https://gateway.test/mcp")
        agent = RecipesAgent(agent_conn, data, gateway=gateway)
        threading.Thread(target=agent_conn.serve, daemon=True).start()
        client = AcpClient(connection=client_conn, permission="allow-once")
        client.start()
        client.initialize()
        session_id = client.new_session(cwd="/tmp")
        try:
            return client.prompt(text, session_id), client
        finally:
            client.stop()

    def test_no_key_answers_with_the_missing_key_wording(self):
        fetch = gateway_answer("")
        result, client = self.turn("I have chicken, rice and coconut milk, what can I make?",
                                   fetch, "")
        #: An answer, not a crash, and not a failed lookup either.
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("premium skill", result["text"])
        self.assertIn("MCP_LICENSE_KEY", result["text"])
        self.assertIn("no licence key is set", result["text"])
        self.assertEqual(len(client.permission_requests), 1)
        #: Nothing was spent on a call the gate was never going to let through.
        self.assertEqual(fetch.calls, [])

    def test_a_bad_key_returns_the_gateways_own_wording(self):
        fetch = gateway_answer(GATEWAY_DENIAL, is_error=True,
                               structured={"licenceRefusal": True, "reason": "denied"})
        result, _ = self.turn("I have chicken, rice and coconut milk, what can I make?",
                              fetch, "not-a-real-key")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn(GATEWAY_DENIAL, result["text"])
        self.assertIn("premium", result["text"])
        self.assertEqual(len(fetch.calls), 1)
        self.assertEqual(fetch.calls[0]["payload"]["params"]["name"], "recipes_pantry_match")

    def test_a_good_key_returns_the_matched_recipes(self):
        fetch = gateway_answer(json.dumps(PANTRY_DATA))
        result, _ = self.turn("I have chicken, rice and coconut milk in the cupboard, "
                              "what can I make?", fetch, "k_paid")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("You have: chicken, rice, coconut milk", result["text"])
        self.assertIn("scored 47 candidate recipe(s), tolerating at most 3 missing",
                      result["text"])
        self.assertIn("Thai coconut chicken - Thai - Chicken", result["text"])
        self.assertIn("you have: Chicken, Coconut Milk, Rice", result["text"])
        self.assertIn("to buy: 1 stalk Lemongrass, 2 tbsp Fish Sauce", result["text"])
        self.assertIn("source: not published by TheMealDB", result["text"])
        self.assertIn("source: https://www.bbcgoodfood.com/recipes/biryani", result["text"])
        #: The licence key travels in a header and is never echoed back.
        self.assertEqual(fetch.calls[0]["headers"]["Authorization"], "Bearer k_paid")
        self.assertNotIn("k_paid", result["text"])

    def test_a_good_key_sends_the_cupboard_it_was_asked_about(self):
        fetch = gateway_answer(json.dumps(PANTRY_DATA))
        self.turn("I only have bread and butter, what should I cook?", fetch, "k_paid")
        arguments = fetch.calls[0]["payload"]["params"]["arguments"]
        self.assertEqual(arguments, {"ingredients": ["bread", "butter"]})

    def test_a_dead_gateway_is_a_failed_lookup(self):
        def fetch(url, payload, headers):
            raise OSError("connection refused")

        result, _ = self.turn("I have chicken, rice and coconut milk, what can I make?",
                              fetch, "k_paid")
        self.assertEqual(result["stopReason"], STOP_END_TURN)
        self.assertIn("I could not read TheMealDB", result["text"])

    def test_the_routing_is_narrow(self):
        #: A free question keeps its own free skill even when it mentions an ingredient.
        free = [
            ("how do I cook chicken handi?", "recipes-by-name"),
            ("recipe for Spicy Arrabiata Penne", "recipes-by-name"),
            ("what can I make with chicken breast?", "recipes-by-ingredient"),
            ("what do Italians eat?", "recipes-by-area"),
            ("what areas do you have?", "recipes-list"),
            ("what can you do?", "help"),
            ("", "help"),
        ]
        for text, expected in free:
            self.assertEqual(route(text)[0], expected, text)

        premium = [
            "I have chicken, rice and coconut milk in the cupboard, what can I make?",
            "I only have bread and butter, what should I cook?",
        ]
        for text in premium:
            self.assertEqual(route(text)[0], "recipes-pantry", text)

    def test_the_premium_skill_id_is_published(self):
        from agent import SKILLS

        self.assertIn("recipes-pantry", SKILLS)


if __name__ == "__main__":
    unittest.main(verbosity=2)
