"""Recipes, by name, by ingredient or by country, from TheMealDB (keyless).

Verified live on 2026-09-28:

  https://www.themealdb.com/api/json/v1/1/search.php?s=chicken
      -> 'Chicken Handi' id 52959, with 20 ingredient slots and a full instruction text
  https://www.themealdb.com/api/json/v1/1/filter.php?i=chicken_breast
      -> 7 meals by id and name only: no instructions, no ingredients
  https://www.themealdb.com/api/json/v1/1/filter.php?a=Italian
      -> 21 meals; `list.php?a=list` gives the ~30 areas, `list.php?c=list` the 14 categories
  https://www.themealdb.com/api/json/v1/1/lookup.php?i=52771
      -> 'Spicy Arrabiata Penne', Italian, Vegetarian, source null, 619 characters of steps

Three things the payloads make plain and this reader keeps. `filter.php` returns **ids and
names only**, so a filter answer is a list of dishes and a full answer costs one `lookup.php`
per recipe. `strSource` is null for a lot of recipes, so a recipe with no source says so
rather than borrowing one. And the ingredient slots are 20 fixed `strIngredient1..20` fields
with a matching `strMeasure1..20`, so an empty slot means the recipe uses fewer than 20
ingredients - never a zero.
"""

from __future__ import annotations

import json
import os
import re
import time
from urllib import parse, request
from urllib.error import HTTPError

API = "https://www.themealdb.com/api/json/v1/1"

DATASET = "TheMealDB (themealdb.com)"

DEFAULT_USER_AGENT = "awesome-acps-recipes/1.0 (+https://github.com/mrfentmen/awesome-acps)"

#: TheMealDB's ingredient and measure slots stop at 20.
SLOTS = 20


class RecipesError(RuntimeError):
    """TheMealDB could not be read."""


class RecipesNotFound(RecipesError):
    """TheMealDB answered 404, or named no meal - a real 'nothing here', not a failure."""


def _title(text: str) -> str | None:
    """A dish or ingredient name pulled out of a question, or None."""
    work = str(text or "")
    for char in "?!.,;:'\"’":
        work = work.replace(char, " ")
    match = re.search(r"\b(?:i want to (?:make|cook)|make|cook|recipe for|recipes? for|"
                      r"how do i (?:make|cook)|how to (?:make|cook))\b(.*)", work, re.IGNORECASE)
    if match:
        work = match.group(1)
    kept = [word for word in work.split()
            if any(ch.isalnum() for ch in word)
            and word.lower() not in ("i", "me", "the", "a", "an", "some", "please", "with",
                                     "without", "and", "for", "to", "of", "in", "on", "do",
                                     "how", "what", "can", "there", "is", "it", "my")]
    if not kept:
        return None
    return " ".join(kept)


def _area_from_text(text: str, areas: list[str]) -> str | None:
    """A country the database knows, matched on its own name.

    The suffix is open because readers write the adjective or the plural - "what do Italians
    eat" for the "Italian" area - and a strict word boundary would miss every one of those.
    """
    lowered = str(text or "").lower()
    for area in sorted(areas, key=len, reverse=True):
        if re.search(rf"\b{re.escape(area.lower())}\w*\b", lowered):
            return area
    return None


class RecipesData:
    """TheMealDB: a dish by name, dishes by ingredient, dishes by country."""

    def __init__(self, fetch=None, cache_ttl: float = 3600.0, timeout: float = 30.0,
                 user_agent: str | None = None) -> None:
        self.cache_ttl = float(os.environ.get("RECIPES_CACHE_TTL", cache_ttl))
        self.timeout = float(os.environ.get("RECIPES_HTTP_TIMEOUT", timeout))
        self.user_agent = (user_agent or os.environ.get("RECIPES_USER_AGENT")
                           or DEFAULT_USER_AGENT)
        self._fetch = fetch or self._http_text
        self._cache: dict[str, tuple[float, object]] = {}

    # -- transport ---------------------------------------------------------

    def _http_text(self, url: str) -> str:
        req = request.Request(url, headers={"User-Agent": self.user_agent, "Accept": "*/*"})
        try:
            with request.urlopen(req, timeout=self.timeout) as resp:
                return resp.read().decode("utf-8", "replace")
        except HTTPError as exc:
            raise RecipesNotFound(f"request failed: {exc}") from exc
        except Exception as exc:  # urllib raises many other types too
            raise RecipesError(f"request failed: {exc}") from exc

    def _get(self, url: str, ttl: float | None = None) -> object:
        now = time.time()
        hit = self._cache.get(url)
        if hit and hit[0] > now:
            return hit[1]
        payload = self._fetch(url)
        if isinstance(payload, (str, bytes)):
            try:
                payload = json.loads(payload)
            except ValueError as exc:
                raise RecipesError(f"TheMealDB returned something that is not JSON: {exc}") from exc
        self._cache[url] = (now + (ttl if ttl is not None else self.cache_ttl), payload)
        return payload

    # -- cleaning ----------------------------------------------------------

    @staticmethod
    def _ingredients(meal: dict) -> list[dict]:
        """The recipe's ingredients with their measures, in slot order.

        An empty slot means the recipe uses fewer than 20 ingredients. It is skipped, never
        turned into a blank ingredient with a blank measure.
        """
        out = []
        for slot in range(1, SLOTS + 1):
            name = str(meal.get(f"strIngredient{slot}") or "").strip()
            if not name:
                continue
            measure = str(meal.get(f"strMeasure{slot}") or "").strip()
            out.append({"ingredient": name, "measure": measure or None})
        return out

    @classmethod
    def _clean_meal(cls, meal: dict, full: bool = True) -> dict:
        record = {
            "id": str(meal.get("idMeal") or ""),
            "name": meal.get("strMeal") or "not reported",
            "thumb": meal.get("strMealThumb") or None,
            "area": meal.get("strArea") or meal.get("strCountry") or None,
            "category": meal.get("strCategory") or None,
        }
        if not full:
            return record
        record["tags"] = [tag.strip() for tag in str(meal.get("strTags") or "").split(",")
                          if tag.strip()]
        record["ingredients"] = cls._ingredients(meal)
        record["instructions"] = str(meal.get("strInstructions") or "").strip() or None
        #: TheMealDB leaves strSource null on plenty of recipes; that is reported, not filled.
        record["source"] = str(meal.get("strSource") or "").strip() or None
        record["youtube"] = str(meal.get("strYoutube") or "").strip() or None
        return record

    # -- reads -------------------------------------------------------------

    def areas(self) -> list[str]:
        """Every country TheMealDB files recipes under."""
        payload = self._get(f"{API}/list.php?a=list", ttl=86400.0)
        rows = payload.get("meals") if isinstance(payload, dict) else None
        if not isinstance(rows, list) or not rows:
            raise RecipesNotFound("TheMealDB published no list of areas")
        return [str(row.get("strArea")) for row in rows if row.get("strArea")]

    def categories(self) -> list[str]:
        """Every category TheMealDB files recipes under."""
        payload = self._get(f"{API}/list.php?c=list", ttl=86400.0)
        rows = payload.get("meals") if isinstance(payload, dict) else None
        if not isinstance(rows, list) or not rows:
            raise RecipesNotFound("TheMealDB published no list of categories")
        return [str(row.get("strCategory")) for row in rows if row.get("strCategory")]

    def by_name(self, query: str, limit: int = 10) -> list[dict]:
        """Recipes whose name matches, each with its ingredients and its method."""
        text = str(query or "").strip()
        if not text:
            raise ValueError("tell me which dish, for example Chicken Handi")
        wanted = max(1, min(int(limit), 25))
        payload = self._get(f"{API}/search.php?s={parse.quote(text)}")
        rows = payload.get("meals") if isinstance(payload, dict) else None
        if not isinstance(rows, list) or not rows:
            raise RecipesNotFound(f"TheMealDB has no recipe for {text!r}")
        meals = [self._clean_meal(row) for row in rows[:wanted] if isinstance(row, dict)]
        if not meals:
            raise RecipesNotFound(f"TheMealDB has no recipe for {text!r}")
        return meals

    def by_ingredient(self, ingredient: str, limit: int = 15) -> list[dict]:
        """Recipes that use an ingredient. The filter answers names only, so each one is
        looked up in full - which is why the count is capped."""
        text = str(ingredient or "").strip()
        if not text:
            raise ValueError("tell me which ingredient, for example chicken")
        wanted = max(1, min(int(limit), 10))
        payload = self._get(f"{API}/filter.php?i={parse.quote(text)}")
        rows = payload.get("meals") if isinstance(payload, dict) else None
        if not isinstance(rows, list) or not rows:
            raise RecipesNotFound(f"TheMealDB files no recipe under {text!r}")
        names = [row for row in rows[:wanted] if isinstance(row, dict) and row.get("idMeal")]
        if not names:
            raise RecipesNotFound(f"TheMealDB files no recipe under {text!r}")
        return [self.meal(row["idMeal"]) for row in names]

    def by_area(self, area: str, limit: int = 10) -> list[dict]:
        """Recipes from one country."""
        text = str(area or "").strip()
        if not text:
            raise ValueError("tell me which country, for example Italian")
        wanted = max(1, min(int(limit), 10))
        payload = self._get(f"{API}/filter.php?a={parse.quote(text)}")
        rows = payload.get("meals") if isinstance(payload, dict) else None
        if not isinstance(rows, list) or not rows:
            raise RecipesNotFound(f"TheMealDB files no recipe from {text!r}")
        names = [row for row in rows[:wanted] if isinstance(row, dict) and row.get("idMeal")]
        if not names:
            raise RecipesNotFound(f"TheMealDB files no recipe from {text!r}")
        return [self.meal(row["idMeal"]) for row in names]

    def meal(self, meal_id: str) -> dict:
        """One recipe in full, by the id TheMealDB gave out."""
        text = str(meal_id or "").strip()
        if not text:
            raise ValueError("tell me which recipe id, for example 52771")
        payload = self._get(f"{API}/lookup.php?i={parse.quote(text)}")
        rows = payload.get("meals") if isinstance(payload, dict) else None
        if not isinstance(rows, list) or not rows or not rows[0]:
            raise RecipesNotFound(f"TheMealDB has no recipe {text!r}")
        return self._clean_meal(rows[0])
