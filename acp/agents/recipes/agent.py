"""Recipes - what a dish is, what uses an ingredient, and what a country cooks.

TheMealDB publishes about 300 recipes with every ingredient, its measure and its method,
keyless, and nobody asks it from an editor. "how do I cook chicken handi?" gets the
ingredients and the steps. Working out what to cook from what is already in the cupboard -
matching recipes against a list of ingredients and shopping the difference - is the premium
skill.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from acp_kit import (STOP_END_TURN, STOP_REFUSAL, AcpAgent, GatewayClient,  # noqa: E402
                     GatewayError, SessionContext, empty_premium_answer, premium_call,
                     prompt_text)

from data import (DATASET, RecipesData, RecipesError, RecipesNotFound,  # noqa: E402
                  _area_from_text, _title)

HELP = (
    "I read TheMealDB's recipe API (keyless) - about 300 recipes with every ingredient, its\n"
    "measure and its method. Ask me:\n"
    "  - how do I cook chicken handi?\n"
    "  - what can I make with chicken breast?\n"
    "  - what do Italians eat?\n"
    "  - what areas and categories do you have?\n"
    "TheMealDB is not every recipe ever written: it is a few hundred, filed under a country\n"
    "and a category, and a recipe with no source in the feed is reported without one rather\n"
    "than given an invented link. Matching a list of ingredients against the whole database is\n"
    "the premium skill."
)

PERMISSION_KEY = "recipes-read-mealdb"

SKILLS = ("recipes-by-name", "recipes-by-ingredient", "recipes-by-area", "recipes-list",
          "recipes-pantry", "help")

_LIST_WORDS = re.compile(
    r"\b(what areas|which areas|list .*(?:areas|countries|categories)|"
    r"areas do you have|categories do you have|what cuisines)\b",
    re.IGNORECASE,
)
_INGREDIENT_WORDS = re.compile(
    r"\b(with|using|use|uses|contains?|got any|have any|i have|ingredients?)\b", re.IGNORECASE,
)
_HOW_TO = re.compile(
    r"\b(how do i (?:make|cook)|how to (?:make|cook)|recipe for|recipes? for|"
    r"i want to (?:make|cook)|make me|cook me|how does? .* taste)\b",
    re.IGNORECASE,
)
#: A question about a country's food. The area is resolved against TheMealDB's own published
#: list inside the skill, so routing stays a pure function with no network in it.
_AREA_WORDS = re.compile(
    r"\b(eats?|cuisine|cooking|foods?|dishes?|recipes? from|food from)\b",
    re.IGNORECASE,
)
_OTHER_WORDS = re.compile(
    r"\b(weather|episode|season|water table|quake|flight|stock price|package version|"
    r"latest xkcd|comic)\b",
    re.IGNORECASE,
)
#: The premium question, and the only one. The free skills answer about one dish, one
#: ingredient or one country; this takes a list of what is in the cupboard and reports the
#: recipes that need the fewest extra things. It needs the cupboard words, so "what can I
#: make with chicken" stays free.
_PANTRY_WORDS = re.compile(
    r"\b(in the (?:cupboard|pantry|fridge|larder)|have (?:got )?(?:in|at home)|"
    r"only have|left in the|what can i (?:make|cook)|what should i (?:make|cook)|"
    r"from what i have|with what i have|shopping list|missing ingredients?)\b",
    re.IGNORECASE,
)
_LIST_RE = re.compile(r"\b(?:i have|i only have|i've only got|only have|i've got|i got|"
                      r"got|with|using|use)\s+"
                      r"([a-z0-9 ,'\-]+?)(?:\s+(?:in|available|sitting|at home)\b|[.?!]|$)",
                      re.IGNORECASE)


def _ingredients_from_text(text: str) -> list[str]:
    """A cupboard list written as "I have chicken, rice and coconut milk"."""
    match = _LIST_RE.search(str(text or ""))
    if not match:
        return []
    raw = match.group(1)
    parts = re.split(r",|\band\b", raw)
    out = []
    for part in parts:
        #: A trailing question rides along with the list ("bread and butter, what should I
        #: cook?"), so a clause that is asking for something is not an ingredient.
        if re.search(r"\b(what|how|can i|should i|could i|do i|would i|is there|any ideas)\b",
                     part, re.IGNORECASE):
            continue
        cleaned = re.sub(r"\b(only|just|some|fresh|dried|ground|chopped|sliced|little|bit of)\b",
                         " ", part, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s+", " ", cleaned).strip(" -'")
        if cleaned and any(ch.isalpha() for ch in cleaned):
            out.append(cleaned)
    return out


def route(text: str) -> tuple[str, dict]:
    """Deterministic intent routing: (skill, params). Pure function, easy to test."""
    stripped = str(text or "").strip()
    if not stripped or re.search(r"\b(help|what can you do|commands?)\b", stripped, re.IGNORECASE):
        return "help", {}
    if _OTHER_WORDS.search(stripped):
        return "help", {}
    # Checked before the free routes, and narrow on purpose: a cupboard question. "what can I
    # make with chicken breast" is free; the premium case names more than one ingredient and
    # says where they are.
    if _PANTRY_WORDS.search(stripped):
        ingredients = _ingredients_from_text(stripped)
        #: One ingredient is not a cupboard: "what can I make with chicken breast" is a free
        #: question about one ingredient, and only falls through to the free routes.
        if len(ingredients) >= 2:
            return "recipes-pantry", {"ingredients": ingredients}
    if _LIST_WORDS.search(stripped):
        return "recipes-list", {}
    if _HOW_TO.search(stripped):
        dish = _title(stripped)
        if not dish:
            return "help", {}
        return "recipes-by-name", {"query": dish}
    if _INGREDIENT_WORDS.search(stripped):
        ingredient = _title(stripped)
        if not ingredient:
            return "help", {}
        return "recipes-by-ingredient", {"query": ingredient}
    if _AREA_WORDS.search(stripped):
        return "recipes-by-area", {"query": stripped}
    return "help", {}


def render_meal(meal: dict, head: str = "") -> str:
    """One recipe: where it is from, what goes in it, and how it is made."""
    title = f"{head}{meal['name']}" if head else meal["name"]
    lines = [title]
    bits = []
    if meal["area"]:
        bits.append(meal["area"])
    if meal["category"]:
        bits.append(meal["category"])
    if meal.get("tags"):
        bits.append("tagged " + ", ".join(meal["tags"]))
    if bits:
        lines.append("  " + " / ".join(bits))
    lines.append(f"  {len(meal.get('ingredients') or [])} ingredient(s):")
    for row in meal.get("ingredients") or []:
        measure = row["measure"] or "amount not reported"
        lines.append(f"    {measure} {row['ingredient']}")
    if meal.get("instructions"):
        steps = [line.strip() for line in re.split(r"(?<=[.!?])\s+|\r?\n+", meal["instructions"])
                 if line.strip()]
        for step in steps:
            lines.append(f"  {step}")
    else:
        lines.append("  no method published for this recipe")
    lines.append(f"  recipe id {meal['id']}")
    if meal.get("source"):
        lines.append(f"  source: {meal['source']}")
    else:
        lines.append("  source: not published by TheMealDB")
    if meal.get("thumb"):
        lines.append(f"  picture: {meal['thumb']}")
    return "\n".join(lines)


def render_list(meal_list: list[dict], head: str) -> str:
    """A list of recipes: name, country, category and how many ingredients each needs."""
    lines = [head]
    for index, meal in enumerate(meal_list, start=1):
        bits = []
        if meal.get("area"):
            bits.append(meal["area"])
        if meal.get("category"):
            bits.append(meal["category"])
        count = len(meal.get("ingredients") or [])
        bits.append(f"{count} ingredient(s)" if count else "ingredients not looked up")
        lines.append(f"  {index:>2}. {meal['name']} - {', '.join(bits)}")
    return "\n".join(lines)


def render_areas(data: dict) -> str:
    """What TheMealDB files recipes under, and how big each list is."""
    areas = data.get("areas") or []
    categories = data.get("categories") or []
    lines = [f"TheMealDB files recipes under {len(areas)} area(s) and "
             f"{len(categories)} category(ies)"]
    lines.append("  areas: " + ", ".join(areas))
    lines.append("  categories: " + ", ".join(categories))
    return "\n".join(lines)


def _num(value) -> str:
    """A number for a line of text, or the honest 'not reported'."""
    if value is None or value == "":
        return "not reported"
    try:
        return f"{float(value):g}"
    except (TypeError, ValueError):
        return str(value)


def render_pantry(data: dict) -> str:
    """What can be cooked from the cupboard, and what has to be bought."""
    have = data.get("youHave") or []
    lines = ["You have: " + (", ".join(str(item) for item in have) or "not reported")]
    lines.append(f"  scored {data.get('candidatesConsidered', 'not reported')} candidate "
                 f"recipe(s), tolerating at most "
                 f"{data.get('maxMissing', 'not reported')} missing ingredient(s)")
    for recipe in data.get("recipes") or []:
        lines.append("")
        lines.append(f"  {recipe.get('name', 'not reported')}"
                     + (f" - {recipe['area']}" if recipe.get("area") else "")
                     + (f" - {recipe['category']}" if recipe.get("category") else ""))
        lines.append("    you have: " + (", ".join(recipe.get("youHave") or []) or "nothing"))
        shopping = recipe.get("shoppingList") or []
        lines.append("    to buy: " + (", ".join(shopping) if shopping else "nothing"))
        if recipe.get("source"):
            lines.append(f"    source: {recipe['source']}")
        else:
            lines.append("    source: not published by TheMealDB")
    lines.append(f"  source: {data.get('source', 'not reported')}")
    return "\n".join(lines)


class RecipesAgent(AcpAgent):
    name = "recipes"
    title = "Recipes - one dish, one ingredient, one country, or what is in the cupboard"
    version = "1.0.0"

    def __init__(self, connection=None, data: RecipesData | None = None, gateway=None) -> None:
        super().__init__(connection)
        self.data = data or RecipesData()
        # The licence check lives on the gateway, not here, so deleting a line
        # from this repository buys nobody the answer.
        self.gateway = gateway or GatewayClient()

    # -- ACP ---------------------------------------------------------------

    def new_session(self, session) -> dict:
        session.remember("agent", "Recipes session opened. " + HELP.splitlines()[0])
        return {}

    def prompt(self, ctx: SessionContext, prompt: list[dict]) -> str:
        text = prompt_text(prompt)
        skill, params = route(text)
        ctx.plan([
            (f"Route the request ({skill})", "high"),
            ("Read TheMealDB's recipe API", "medium"),
            ("Report the ingredients and the method", "medium"),
        ])

        if skill == "help":
            ctx.stream_text(HELP)
            ctx.message("TheMealDB is a few hundred recipes, not every recipe ever written.")
            return STOP_END_TURN

        tool = f"call_{skill.replace('-', '_')}"
        ctx.tool_call(tool, "Read TheMealDB's recipe API", kind="fetch", name=skill,
                      raw_input=dict(params))
        if not ctx.ask_permission(tool, "Allow Recipes to read TheMealDB's public recipes?",
                                  remember_key=PERMISSION_KEY):
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content("permission denied"))
            ctx.message("I need permission to read TheMealDB's recipes first.")
            return STOP_REFUSAL
        ctx.tool_call_update(tool, status="in_progress")

        try:
            if skill == "recipes-pantry":
                return self._run_skill(ctx, params, tool)
            if skill == "recipes-list":
                body = render_areas({"areas": self.data.areas(),
                                     "categories": self.data.categories()})
                summary = f"{len(self.data.areas())} area(s), {len(self.data.categories())} categories"
            elif skill == "recipes-by-name":
                meals = self.data.by_name(params["query"], limit=1)
                body = render_meal(meals[0])
                summary = f"{meals[0]['name']}: {len(meals[0]['ingredients'])} ingredient(s)"
            elif skill == "recipes-by-ingredient":
                meals = self.data.by_ingredient(params["query"], limit=6)
                body = render_list(meals, f"{len(meals)} recipe(s) using {params['query']!r}:")
                body += "\n\n  full method for the first one:\n\n" + "\n".join(
                    "  " + line for line in render_meal(meals[0]).splitlines())
                summary = f"{len(meals)} recipe(s) using {params['query']!r}"
            else:
                areas = self.data.areas()
                area = _area_from_text(params.get("query", text), areas)
                if not area:
                    return self._say_no_area(ctx, tool, areas)
                meals = self.data.by_area(area, limit=8)
                body = render_list(meals, f"{len(meals)} recipe(s) from {area}:")
                summary = f"{len(meals)} recipe(s) from {area}"
        except (RecipesError, GatewayError, ValueError) as exc:
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content(str(exc)))
            ctx.message(f"I could not read TheMealDB: {exc}")
            return STOP_END_TURN

        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message(f"\nSource: {DATASET}, read live. TheMealDB holds a few hundred recipes and "
                    "leaves the source blank on many of them, which I report rather than fill "
                    "in.")
        return STOP_END_TURN

    def _say_no_area(self, ctx: SessionContext, tool: str, areas: list[str]) -> str:
        """No country the database knows, named in the question."""
        ctx.tool_call_update(tool, status="completed",
                             content=ctx.text_content("no known area named"))
        ctx.stream_text("I could not tell which country that is. TheMealDB files recipes under "
                        f"{len(areas)} areas, among them " + ", ".join(areas[:12]) + ".\n")
        ctx.message("Ask for one of those and I will pull the recipes from it.")
        return STOP_END_TURN

    def _run_skill(self, ctx: SessionContext, params: dict, tool: str) -> str:
        """The premium skill. The licence is checked on the gateway, not here."""
        arguments: dict = {"ingredients": [str(item) for item in params["ingredients"]]}

        data, refused = premium_call(self.gateway, "recipes_pantry_match", arguments,
                                     {"agent": "recipes"})
        if refused:
            # Already an (answer, artifact) pair, worded by the gateway.
            answer, artifact = refused
            ctx.tool_call_update(tool, status="completed",
                                 content=ctx.text_content(artifact["summary"]))
            ctx.stream_text(answer + "\n")
            ctx.message("That is a premium skill, so the answer comes from the licence gateway. "
                        "The wording above is the gateway's own.")
            return STOP_END_TURN

        if not isinstance(data, dict) or not data.get("recipes"):
            answer, artifact = empty_premium_answer(
                "The licence gateway did not send back a recipe for that cupboard.",
                {"agent": "recipes"})
            ctx.tool_call_update(tool, status="completed",
                                 content=ctx.text_content(artifact["summary"]))
            ctx.stream_text(answer + "\n")
            ctx.message("I could not read a match out of what the gateway sent.")
            return STOP_END_TURN

        body = render_pantry(data)
        summary = (f"{len(data.get('youHave') or [])} ingredient(s) in, "
                   f"{data.get('recipesFound', 'not reported')} recipe(s) out")
        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(summary))
        ctx.stream_text(body + "\n")
        ctx.message(f"\nSource: {data.get('source', DATASET)}, matched on the licence gateway. A "
                    "match is a substring test on the ingredient names, so \"chicken\" counts as "
                    "having \"chicken breast\", and a shopping list is what is genuinely missing "
                    "rather than what the recipe would prefer.")
        return STOP_END_TURN

    def on_cancel(self, session) -> None:
        return None  # one read, one answer


def main(argv=None) -> int:
    import logging

    logging.basicConfig(level=logging.INFO, stream=sys.stderr,
                        format="%(asctime)s %(levelname)s %(name)s %(message)s")
    try:
        RecipesAgent().run()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
