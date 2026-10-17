"""The resale agent: five skills over two keyless designer-resale catalogues.

  - resale-search: cheapest matches for a brand and/or a word, across both stores
  - brand-market:  what one brand's resale market looks like right now
  - piece-lookup:  one listing by handle, from the store's own product endpoint
  - price-index:   a cross-brand price index, computed on a hosted service that was removed (not implemented here)
  - help:          what this agent reads and what it will not guess

No watch: a price changes on the scale of days and this server does not poll two storefronts to
watch one. Routing is deterministic rules and the prices are the stores' own variant prices —
Fashionphile publishes no condition in its catalogue JSON, so those rows say "not reported"
rather than borrowing Rebag's words.
"""

from __future__ import annotations

import re

from a2a_kit import SkillAgent

from data import (
    DATASET_FASHIONPHILE,
    DATASET_REBAG,
    DATASETS,
    DEFAULT_LIMIT,
    KNOWN_BRANDS,
    STORE_NAMES,
    ResaleClient,
    UpstreamError,
    brands_in_text,
)

SKILL_SEARCH = "resale-search"
SKILL_MARKET = "brand-market"
SKILL_PIECE = "piece-lookup"
SKILL_INDEX = "price-index"
SKILL_HELP = "help"

SKILLS = (SKILL_SEARCH, SKILL_MARKET, SKILL_PIECE, SKILL_INDEX, SKILL_HELP)

#: The gateway tool behind the premium skill, and the pages it reads per brand.
PREMIUM_TOOL = "resale_price_index"
PREMIUM_PAGES = 2

MAX_INDEX_BRANDS = 4
MAX_LISTED_ROWS = 8

HELP = (
    "I read the public resale catalogues of Fashionphile and Rebag. Ask me:\n"
    "  • what does a chanel flap cost\n"
    "  • show me rolex watches\n"
    "  • what is the chanel market like right now\n"
    "  • pull the listing handbags-hermes-maxibox-bag-294167871\n"
    "  • compare chanel, gucci and prada (not implemented here)\n"
    "Prices are the stores' own variant prices in US dollars; a listing that has sold stays in "
    "the catalogue, so I report how many are still available. I never estimate a price myself."
)

_URL_RE = re.compile(r"https?://[^\s]*?/products/([A-Za-z0-9][A-Za-z0-9._-]{3,120})", re.IGNORECASE)
_HANDLE_RE = re.compile(
    r"\b(?:handle|listing|item)\s*#?\s*([A-Za-z0-9][A-Za-z0-9._-]{3,120})", re.IGNORECASE)
_BARE_HANDLE_RE = re.compile(r"^([A-Za-z0-9][A-Za-z0-9._-]{7,120})$")
_COMPARE_RE = re.compile(
    r"\b(compare|comparison|versus|vs\.?|price index|index|across|market report|which brand|"
    r"holds? (?:its )?value|better value|best value)\b", re.IGNORECASE)
_MARKET_RE = re.compile(
    r"\b(market|resale value|how much|what does|what do|worth|price range|prices?|"
    r"go(?:es)? for|cost)\b", re.IGNORECASE)
_HELP_RE = re.compile(r"\b(help|what can you do|commands?)\b", re.IGNORECASE)

#: Words that are asking, not matching. Kept small: anything left is treated as a search term.
_STOPWORDS = frozenset({
    "help", "what", "which", "who", "how", "much", "does", "do", "is", "are", "was", "were",
    "the", "a", "an", "and", "or", "of", "for", "in", "on", "at", "to", "me", "my", "you",
    "show", "find", "search", "list", "give", "get", "tell", "about", "with", "right", "now",
    "today", "please", "market", "resale", "value", "worth", "cost", "costs", "price", "prices",
    "pricey", "compare", "comparison", "across", "brand", "brands", "versus", "vs", "index",
    "item", "items", "listing", "listings", "handle", "going", "go", "goes", "like",
    "look", "looks", "looking",
    "some", "any", "under", "over", "cheap", "cheapest", "expensive", "most",
    "can", "could", "should", "would", "will", "it", "this", "that", "these", "those",
    "have", "has", "want", "need", "know", "hello", "hi", "hey", "thanks", "thank", "there",
})


def bare_handle(text: str) -> str | None:
    """A message that is nothing but a slug ("chanel-caviar-...-1979023") is the handle this
    server just asked for, not a fresh search. Require a hyphen and a digit so a bare brand
    ("chanel") still routes as usual."""
    token = text.strip()
    if _BARE_HANDLE_RE.match(token) and "-" in token and any(char.isdigit() for char in token):
        return token
    return None


def message_text(message: dict) -> str:
    parts = message.get("parts") or []
    return " ".join(part.get("text", "") for part in parts if part.get("kind") == "text").strip()


def message_data(message: dict) -> dict:
    merged: dict = {}
    for part in message.get("parts") or []:
        if part.get("kind") == "data" and isinstance(part.get("data"), dict):
            merged.update(part["data"])
    return merged


def _first(params: dict, *names, default=None):
    for name in names:
        if name in params and params[name] not in (None, ""):
            return params[name]
    return default


def usd(value) -> str:
    """A price as the stores write it, or a plain statement that none was given."""
    if value is None:
        return "price not reported"
    return f"${value:,.0f}"


def keyword_from_text(text: str) -> str | None:
    """The search term in a question, or None. Brands are dropped — the reader filters on those.

    One word on purpose: the catalogues are matched on a substring of the title, and a two-word
    phrase that no title happens to contain would lose a listing that does match.
    """
    brands = {alias for name in brands_in_text(text) for alias in KNOWN_BRANDS[name]}
    words = re.findall(r"[A-Za-z][A-Za-z'&-]{2,24}", text)
    kept = [word for word in words
            if word.lower() not in _STOPWORDS and word.lower() not in brands]
    return kept[0] if kept else None


def brands_from_data(value) -> list[str]:
    """Brands named in a data part: a list, or one comma-separated string."""
    if isinstance(value, str):
        raw = [part for part in value.split(",")]
    elif isinstance(value, (list, tuple)):
        raw = list(value)
    else:
        raw = []
    out: list[str] = []
    for part in raw:
        name = str(part or "").strip()
        if name and name not in out:
            out.append(name)
    return out


def singular(word: str) -> str:
    """The catalogue titles are singular ('... Necklace'), so a plural ask gets a singular need."""
    if len(word) < 5:
        return word
    if word.endswith("ies"):
        return word[:-3] + "y"
    if word.endswith(("ches", "shes", "sses", "xes", "zes")):
        return word[:-2]
    if word.endswith("s") and not word.endswith("ss"):
        return word[:-1]
    return word


def route(text: str) -> tuple[str, dict]:
    """Deterministic intent routing: (skill, params). Pure function, easy to test."""
    if not text.strip() or _HELP_RE.search(text):
        return SKILL_HELP, {}

    url = _URL_RE.search(text)
    if url:
        source = DATASET_FASHIONPHILE if "fashionphile" in url.group(0) else (
            DATASET_REBAG if "rebag" in url.group(0) else None)
        return SKILL_PIECE, {"handle": url.group(1), "source": source}
    handle = _HANDLE_RE.search(text)
    if handle:
        return SKILL_PIECE, {"handle": handle.group(1), "source": None}

    brands = brands_in_text(text)
    if len(brands) >= 2 and _COMPARE_RE.search(text):
        return SKILL_INDEX, {"brands": brands[:MAX_INDEX_BRANDS]}

    keyword = keyword_from_text(text)
    if brands:
        # A market question is about the whole brand; a word that narrows to a piece ("chanel
        # flap"), or a plural of one ("rolex watches"), is a search for that piece instead.
        if _MARKET_RE.search(text) and not keyword:
            return SKILL_MARKET, {"brand": brands[0]}
        return SKILL_SEARCH, {"brand": brands[0], "keyword": keyword}
    return SKILL_SEARCH, {"brand": None, "keyword": keyword}


def parse(message: dict) -> dict:
    """Incoming message -> {skill, params, explicit}. Never raises.

    "explicit" says whether the caller actually named a skill or a question this server can
    route, so the protocol knows a bare follow-up ("rolex") belongs to the skill it asked
    about rather than starting a fresh search.
    """
    text = message_text(message)
    data = message_data(message)
    requested = _first(data, "skill", "skill_id")

    handle = _first(data, "handle", "listing", "url")
    bare: str | None = None
    source = _first(data, "source", "store")
    brand = _first(data, "brand")
    keywords = brands_from_data(_first(data, "brands"))
    if not brand and keywords:
        brand = keywords[0]
    keyword = _first(data, "keyword", "q", "query", "search")
    pages = _first(data, "pages")
    limit = _first(data, "limit", "count")

    routed_skill, routed = route(text)
    asked_for_compare = bool(_COMPARE_RE.search(text))
    asked_for_market = bool(_MARKET_RE.search(text))
    asked_for_help = bool(_HELP_RE.search(text))

    named_brands = brands_in_text(text)
    if not keywords and named_brands:
        keywords = named_brands[:MAX_INDEX_BRANDS]
    if not brand and named_brands:
        brand = named_brands[0]
    if not handle:
        url = _URL_RE.search(text)
        if url:
            handle = url.group(1)
            if not source:
                source = (DATASET_FASHIONPHILE if "fashionphile" in url.group(0)
                          else DATASET_REBAG if "rebag" in url.group(0) else None)
        else:
            found = _HANDLE_RE.search(text)
            if found:
                handle = found.group(1)
            else:
                bare = bare_handle(text)
                if bare:
                    handle = bare
    if not keyword and not handle:
        keyword = keyword_from_text(text)

    if requested in SKILLS:
        skill = requested
    elif handle:
        skill = SKILL_PIECE
    elif len(keywords) >= 2 and asked_for_compare:
        skill = SKILL_INDEX
    else:
        skill = routed_skill

    params: dict = {}
    if skill == SKILL_INDEX:
        params["brands"] = [name for name in (keywords or ([brand] if brand else []))][:MAX_INDEX_BRANDS]
    elif skill == SKILL_PIECE:
        params["handle"] = handle
        params["source"] = source
    elif skill == SKILL_MARKET:
        params["brand"] = brand
        params["pages"] = pages
    elif skill == SKILL_SEARCH:
        params["brand"] = brand
        params["keyword"] = keyword
        params["limit"] = limit
    # A bare value ("chanel", "rolex") answers the question this server just asked: it names
    # nothing new to route on, so the protocol keeps the pending skill rather than starting over.
    explicit = bool(requested or (handle and not bare)
                    or asked_for_compare or asked_for_market or asked_for_help)
    return {"skill": skill, "params": params, "explicit": explicit}


def _store(source: str) -> str:
    """'fashionphile.com/products.json' -> 'Fashionphile'."""
    return STORE_NAMES.get(source) or source.split(".", 1)[0].capitalize()


def _line(row: dict) -> str:
    parts = [row.get("title") or "untitled"]
    if row.get("vendor"):
        parts.append(row["vendor"])
    parts.append(usd(row.get("price")))
    if row.get("type"):
        parts.append(row["type"])
    return " — ".join(parts)


def run_search(params: dict, client: ResaleClient) -> dict:
    brand = params.get("brand")
    keyword = params.get("keyword")
    if not brand and not keyword:
        return {
            "final_state": "input-required",
            "message": ("Tell me a brand or a word to look for — 'chanel flap', 'rolex submariner', "
                        "'cartier bracelet' — and I will read both catalogues."),
            "artifact": None,
            "watch": None,
        }
    limit = client.check_limit(params.get("limit") or DEFAULT_LIMIT)
    result = client.search(brand, keyword, limit=limit)
    if not result["rows"] and keyword:
        # The catalogues write singular titles ("... Necklace"), so a plural ask gets one retry.
        retry = " ".join(singular(word) for word in keyword.split())
        if retry.lower() != keyword.lower():
            result = client.search(brand, retry, limit=limit)
    rows = result["rows"]
    what = " and ".join(part for part in (result["brand"], result["keyword"]) if part)
    artifact = {
        "dataset": result["sources"],
        "source": "Fashionphile (fashionphile.com) and Rebag (shop.rebag.com)",
        "brand": result["brand"],
        "keyword": result["keyword"],
        "sources": result["sources"],
        "read": result["read"],
        "count": len(rows),
        "rows": rows,
    }
    if not rows:
        return {
            "final_state": "completed",
            "message": (f"No listing in the pages I read matches {what} on either storefront. "
                        f"{result['read']:,} products were scanned — the catalogues only carry what "
                        f"is listed right now, so a quiet result is a quiet result, not an outage. "
                        f"Try a shorter word, or just the brand."),
            "artifact": artifact,
            "watch": None,
        }
    lines = [f"Cheapest matches for {what} across Fashionphile and Rebag:"]
    for row in rows:
        lines.append(f"  • {_line(row)}")
        condition = row.get("condition")
        state = "available" if row.get("available") else "sold, still listed"
        lines.append(f"    {state}; condition: {condition or 'not reported'}; {_store(row['source'])}")
        if row.get("url"):
            lines.append(f"    {row['url']}")
    lines.append(
        f"\nSource: {', '.join(result['sources'])} (read live, {result['read']:,} products "
        "scanned). Rebag states a condition per listing; Fashionphile does not publish one in its "
        "catalogue JSON, so those rows say so. These are asking prices, and a sold listing stays "
        "in the catalogue, so availability is reported per listing."
    )
    return {"final_state": "completed", "message": "\n".join(lines), "artifact": artifact,
            "watch": None}


def run_market(params: dict, client: ResaleClient) -> dict:
    brand = params.get("brand")
    if not brand:
        return {
            "final_state": "input-required",
            "message": ("Which brand's market should I read — chanel, hermes, gucci, prada, dior, "
                        "saint laurent, balenciaga, bottega veneta, cartier, rolex, louis vuitton, "
                        "tiffany?"),
            "artifact": None,
            "watch": None,
        }
    pages = client.check_pages(params.get("pages"))
    market = client.brand_market(brand, pages=pages)
    artifact = {
        "dataset": market["sources"],
        "source": "Fashionphile (fashionphile.com) and Rebag (shop.rebag.com)",
        "brand": market["brand"],
        "count": market["count"],
        "available": market["available"],
        "listed": market["listed"],
        "priced": market["priced"],
        "median": market["median"],
        "low": market["low"],
        "high": market["high"],
        "conditions": market["conditions"],
        "types": market["types"],
        "by_source": market["by_source"],
        "read": market["read"],
        "sources": market["sources"],
        "rows": market["rows"][:MAX_LISTED_ROWS],
    }
    if not market["count"]:
        return {
            "final_state": "completed",
            "message": (f"No {market['brand']} listing is on either storefront in the "
                        f"{market['read']:,} products I read ({', '.join(market['sources'])}). "
                        f"Either the brand is spelled differently by the stores or nothing is "
                        f"listed right now — I will not guess a market from an empty page."),
            "artifact": artifact,
            "watch": None,
        }
    lines = [f"The {market['brand']} resale market right now ({market['read']:,} products scanned "
             f"across {', '.join(market['sources'])}):"]
    lines.append(f"  • {market['count']} live listings: {market['available']} available, "
                 f"{market['listed']} sold-and-still-listed")
    lines.append(f"  • asking prices: {usd(market['low'])} to {usd(market['high'])}, "
                 f"median {usd(market['median'])} (over {market['priced']} priced listings)")
    if market["types"]:
        lines.append("  • most listed types: " + ", ".join(
            f"{name} ({count})" for name, count in market["types"].items()))
    if market["conditions"]:
        lines.append("  • conditions: " + ", ".join(
            f"{name} ({count})" for name, count in sorted(market["conditions"].items())))
    else:
        lines.append("  • conditions: not reported by these sources in the pages read")
    lines.append("  • cheapest listings:")
    for row in market["rows"][:5]:
        lines.append(f"      {_line(row)} — {'available' if row['available'] else 'sold'}")
    lines.append(
        f"\nSource: {', '.join(market['sources'])} (read live). These are asking prices on a "
        "resale marketplace, not realised sale prices, and a sold listing stays in the catalogue "
        "— so I count availability rather than pretend the stock is all for sale."
    )
    return {"final_state": "completed", "message": "\n".join(lines), "artifact": artifact,
            "watch": None}


def run_piece(params: dict, client: ResaleClient) -> dict:
    handle = params.get("handle")
    if not handle:
        return {
            "final_state": "input-required",
            "message": ("Give me a listing handle or a product URL and I will pull that one "
                        "listing."),
            "artifact": None,
            "watch": None,
        }
    clean = client.check_handle(handle)
    source = params.get("source")
    sources = [source] if source else list(DATASETS)
    errors: list[str] = []
    for candidate in sources:
        try:
            row = client.listing(candidate, clean)
        except (UpstreamError, ValueError) as exc:
            errors.append(f"{_store(candidate)}: {exc}")
            continue
        artifact = {
            "dataset": candidate,
            "source": _store(candidate),
            "title": row["title"],
            "handle": row["handle"],
            "vendor": row["vendor"],
            "price": row["price"],
            "available": row["available"],
            "condition": row["condition"],
            "type": row["type"],
            "url": row["url"],
            "image": row.get("image"),
            "description": row["description"],
        }
        lines = [
            f"{row['title']} ({row['vendor']})",
            f"  • price: {usd(row['price'])} — "
            f"{'available' if row['available'] else 'sold, still listed'}",
            f"  • type: {row['type'] or 'not reported'}; condition: "
            f"{row['condition'] or 'not reported'}",
        ]
        if row.get("description"):
            lines.append(f"  • description: {row['description']}")
        if row.get("url"):
            lines.append(f"  • {row['url']}")
        lines.append(
            f"\nSource: {_store(candidate)} (read live from {candidate}). A handle only exists on "
            "the store that issued it, so a miss on one storefront is not a missing listing — the "
            "other one is tried first."
        )
        return {"final_state": "completed", "message": "\n".join(lines), "artifact": artifact,
                "watch": None}
    raise UpstreamError("; ".join(errors) or "no catalogue has that handle")


def run_index(params: dict, client: ResaleClient, gateway: object) -> dict:
    """Stub: the hosted implementation of this skill was removed in the paywall cleanup."""
    return {
        "final_state": "completed",
        "message": 'Not yet implemented: index — its hosted implementation was removed.',
        "artifact": {"removed": True},
        "watch": None,
    }


def run_help() -> dict:
    return {
        "final_state": "completed",
        "message": HELP,
        "artifact": {"dataset": list(DATASETS), "skill": SKILL_HELP, "skills": list(SKILLS)},
        "watch": None,
    }


class ResaleAgent(SkillAgent):
    name = "resale"
    card_name = "Designer Resale Agent"
    card_description = (
        "Read-only agent over the public resale catalogues of Fashionphile and Rebag: the "
        "cheapest live listings for a brand and/or a word with the store's own variant prices and "
        "availability, a whole brand's market (counts, asking-price range, median, conditions, "
        "types), and one listing by handle. Every price is quoted as the store states it, in US "
        "dollars. A cross-brand price index runs on a hosted service that was removed."
    )
    env_prefix = "RESALE"
    datasets = (DATASET_FASHIONPHILE, DATASET_REBAG)
    card_skills = [
        {
            "id": SKILL_SEARCH,
            "name": "Search the resale catalogues",
            "description": (
                "The cheapest matching listings for a brand and/or a word across Fashionphile and "
                "Rebag, with each store's own price, whether the listing is still available, and "
                "the condition where the store publishes one. Reads two pages of each catalogue "
                "(250 products a page) by default. Prices are asking prices in US dollars."
            ),
            "tags": ["resale", "shopping", "chanel", "hermes", "gucci", "prices", "listing"],
            "examples": [
                "What does a chanel flap cost?",
                '{"skill": "resale-search", "brand": "rolex", "keyword": "submariner"}',
            ],
            "inputModes": ["text/plain", "application/json"],
            "outputModes": ["application/json", "text/plain"],
        },
        {
            "id": SKILL_MARKET,
            "name": "One brand's resale market",
            "description": (
                "What a brand's market looks like right now: how many live listings, how many are "
                "still available, the asking-price range and median, the conditions where the "
                "stores publish them, the most listed product types, and the cheapest examples."
            ),
            "tags": ["resale", "market", "median", "price-range", "brand"],
            "examples": [
                "What is the chanel market like right now?",
                '{"skill": "brand-market", "brand": "hermes", "pages": 3}',
            ],
            "inputModes": ["text/plain", "application/json"],
            "outputModes": ["application/json", "text/plain"],
        },
        {
            "id": SKILL_PIECE,
            "name": "Look up one listing",
            "description": (
                "One listing by handle or product URL, read from the store's own product endpoint: "
                "title, brand, price, availability, condition where published, type, and the "
                "store's own description. A handle is tried on both storefronts unless the source "
                "is named."
            ),
            "tags": ["resale", "listing", "handle", "item"],
            "examples": [
                "Pull the listing handbags-hermes-maxibox-bag-294167871",
                '{"skill": "piece-lookup", "handle": "jewelry-cartier-love-bracelet-285417543"}',
            ],
            "inputModes": ["text/plain", "application/json"],
            "outputModes": ["application/json", "text/plain"],
        },
        {
            "id": SKILL_INDEX,
            "name": "Cross-brand price index (not implemented here)",
            "description": (
                "Two to four brands compared at once over the same catalogues: listings and "
                "availability per brand, median and range of asking prices, which brand carries the "
                "highest and lowest median, and which has the most listings. Premium: it runs "
                "on a hosted service that was removed, so the numbers only exist for a caller "
                "with a key."
            ),
            "tags": ["resale", "index", "compare", "median"],
            "examples": [
                "Compare chanel, gucci and prada",
                '{"skill": "price-index", "brands": ["chanel", "hermes", "rolex"]}',
            ],
            "inputModes": ["text/plain", "application/json"],
            "outputModes": ["application/json", "text/plain"],
        },
        {
            "id": SKILL_HELP,
            "name": "What this agent reads",
            "description": (
                "The catalogues this agent reads, the questions it answers, the price premium "
                "skill, and the two things it will not do: estimate a price, or invent a condition "
                "Fashionphile does not publish."
            ),
            "tags": ["resale", "help"],
            "examples": ["What can you do?"],
            "inputModes": ["text/plain"],
            "outputModes": ["text/plain"],
        },
    ]

    def __init__(self, client: ResaleClient | None = None,
                 gateway: object | None = None) -> None:
        self.client = client or ResaleClient()
        self.gateway = gateway

    def parse(self, message: dict) -> dict:
        return parse(message)

    def missing(self, skill: str, params: dict) -> list[str]:
        if skill == SKILL_SEARCH and not (params.get("brand") or params.get("keyword")):
            return ["a brand or a word to look for"]
        if skill == SKILL_MARKET and not params.get("brand"):
            return ["a brand"]
        if skill == SKILL_PIECE and not params.get("handle"):
            return ["a listing handle"]
        if skill == SKILL_INDEX and len(params.get("brands") or []) < 2:
            return ["two to four brands"]
        return []

    def input_prompt(self, skill: str, missing: list[str]) -> str:
        if skill == SKILL_MARKET:
            return ("Which brand's market? I know chanel, hermes, gucci, prada, dior, saint "
                    "laurent, balenciaga, bottega veneta, cartier, rolex, louis vuitton and "
                    "tiffany.")
        if skill == SKILL_PIECE:
            return ("Which listing? Give me a handle like "
                    "'handbags-hermes-maxibox-bag-294167871' or a product URL.")
        if skill == SKILL_INDEX:
            return ("The premium index needs two to four brands — name them, like 'compare chanel, "
                    "gucci and prada'. It is not implemented here.")
        return ("What should I look for? Give me a brand, a word, or both — 'chanel flap', 'rolex "
                "submariner', 'cartier bracelet' — and I will read both catalogues.")

    def run(self, request: dict) -> dict:
        if request["missing"]:
            return {
                "final_state": "input-required",
                "message": self.input_prompt(request["skill"], request["missing"]),
                "artifact": None,
                "watch": None,
            }
        skill, params = request["skill"], request["params"]
        try:
            if skill == SKILL_INDEX:
                return run_index(params, self.client, self.gateway)
            if skill == SKILL_MARKET:
                return run_market(params, self.client)
            if skill == SKILL_PIECE:
                return run_piece(params, self.client)
            if skill == SKILL_SEARCH:
                return run_search(params, self.client)
        except (UpstreamError, ValueError) as exc:
            return {
                "final_state": "failed",
                "message": f"I could not read the resale catalogues: {exc}",
                "artifact": {"dataset": list(DATASETS), "skill": skill},
                "watch": None,
            }
        return run_help()


__all__ = [
    "HELP",
    "MAX_INDEX_BRANDS",
    "PREMIUM_PAGES",
    "PREMIUM_TOOL",
    "ResaleAgent",
    "SKILLS",
    "SKILL_HELP",
    "SKILL_INDEX",
    "SKILL_MARKET",
    "SKILL_PIECE",
    "SKILL_SEARCH",
    "keyword_from_text",
    "message_data",
    "message_text",
    "parse",
    "route",
    "run_help",
    "run_index",
    "run_market",
    "run_piece",
    "run_search",
    "singular",
    "usd",
]
