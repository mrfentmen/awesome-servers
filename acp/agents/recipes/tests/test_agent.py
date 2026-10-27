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

from acp_kit import AcpClient, Connection, STOP_END_TURN, STOP_REFUSAL

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
#
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






if __name__ == "__main__":
    unittest.main(verbosity=2)
