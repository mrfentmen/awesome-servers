"""Resale — the designer resale market inside your editor.

No ACP agent could read a resale catalogue before this one. It reads the keyless catalogues of
Fashionphile and Rebag and answers three questions a shopper actually has: what a piece costs
right now, what a whole brand's market looks like, and what one listing is. The fourth skill,
a cross-brand price index, runs on the licence gateway.

Deterministic on purpose: routing is rules, the prices are the stores' own variant prices, and
nothing is invented. Fashionphile does not publish a condition in its catalogue JSON, so those
listings say "condition not reported" instead of borrowing Rebag's words.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from acp_kit import (  # noqa: E402
    STOP_END_TURN,
    STOP_REFUSAL,
    AcpAgent,
    GatewayClient,
    GatewayError,
    SessionContext,
    empty_premium_answer,
    premium_call,
    prompt_text,
)

from data import (  # noqa: E402
    DATASET_FASHIONPHILE,
    DATASET_REBAG,
    KNOWN_BRANDS,
    ResaleData,
    ResaleError,
    brands_in_text,
    category_in_text,
)

HELP = (
    "I read the public resale catalogues of Fashionphile and Rebag. Ask me:\n"
    "  • what does a chanel flap cost\n"
    "  • show me rolex watches\n"
    "  • what is the chanel market like right now\n"
    "  • pull the listing handbags-hermes-maxibox-bag-294167871\n"
    "  • compare chanel, gucci and prada (premium — needs a licence key)\n"
    "Prices are the stores' own variant prices in US dollars; a listing that has sold stays "
    "in the catalogue, so I report how many are still available."
)

PERMISSION_KEY = "resale-read-public-catalogues"

SKILLS = ("resale-search", "brand-market", "piece-lookup", "price-index", "help")

_URL_RE = re.compile(r"https?://[^\s]*?/products/([A-Za-z0-9][A-Za-z0-9._-]{3,120})", re.IGNORECASE)
_HANDLE_RE = re.compile(
    r"\b(?:handle|listing|item)\s*#?\s*([A-Za-z0-9][A-Za-z0-9._-]{3,120})", re.IGNORECASE)
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
    "item", "items", "listing", "listings", "handle", "going", "go", "goes", "for", "like",
    "some", "any", "under", "over", "cheap", "cheapest", "expensive", "most",
    "can", "could", "should", "would", "will", "it", "this", "that", "these", "those",
    "have", "has", "want", "need", "know", "hello", "hi", "hey", "thanks", "thank", "there",
})


def usd(value) -> str:
    """A price as the stores write it, or a plain statement that none was given."""
    if value is None:
        return "price not reported"
    return f"${value:,.0f}"


def keyword_from_text(text: str) -> str | None:
    """The search term in a question, or None. Brands are dropped - the reader filters on those.

    One word on purpose: the catalogues are matched on a substring of the title, and a
    two-word phrase that no title happens to contain would lose a listing that does match.
    """
    brands = {alias for name in brands_in_text(text) for alias in KNOWN_BRANDS[name]}
    words = re.findall(r"[A-Za-z][A-Za-z'&-]{2,24}", text)
    kept = [word for word in words
            if word.lower() not in _STOPWORDS and word.lower() not in brands]
    if not kept:
        return None
    return kept[0]


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
        return "help", {}

    url = _URL_RE.search(text)
    if url:
        source = DATASET_FASHIONPHILE if "fashionphile" in url.group(0) else (
            DATASET_REBAG if "rebag" in url.group(0) else None)
        return "piece-lookup", {"handle": url.group(1), "source": source}
    handle = _HANDLE_RE.search(text)
    if handle:
        return "piece-lookup", {"handle": handle.group(1), "source": None}

    brands = brands_in_text(text)
    if len(brands) >= 2 and _COMPARE_RE.search(text):
        return "price-index", {"brands": brands[:4]}

    keyword = keyword_from_text(text)
    category = category_in_text(text)
    if brands:
        if _MARKET_RE.search(text) and not category:
            return "brand-market", {"brand": brands[0]}
        return "resale-search", {"brand": brands[0], "keyword": keyword, "category": category}
    return "resale-search", {"brand": None, "keyword": keyword, "category": category}


class ResaleAgent(AcpAgent):
    name = "resale"
    title = "Resale — Fashionphile and Rebag"
    version = "1.0.0"

    def __init__(self, connection=None, data: ResaleData | None = None,
                 gateway: GatewayClient | None = None) -> None:
        super().__init__(connection)
        self.data = data or ResaleData()
        self.gateway = gateway or GatewayClient()

    # -- ACP ---------------------------------------------------------------

    def new_session(self, session) -> dict:
        session.remember("agent", "Resale session opened. " + HELP.split("\n", 1)[0])
        return {}

    def prompt(self, ctx: SessionContext, prompt: list[dict]) -> str:
        text = prompt_text(prompt)
        skill, params = route(text)
        ctx.plan([
            (f"Route the request ({skill})", "high"),
            ("Read the public resale catalogues", "medium"),
            ("Report the store's own prices and availability", "medium"),
        ])

        if skill == "help":
            ctx.stream_text(HELP)
            ctx.message("I read two keyless Shopify catalogues — Fashionphile and Rebag — and "
                        "quote their own listing prices. I never estimate a price myself.")
            return STOP_END_TURN

        tool = f"call_{skill}"
        ctx.tool_call(tool, f"Read the resale catalogues for {skill}", kind="fetch", name=skill,
                      raw_input={"skill": skill, **params})
        if not ctx.ask_permission(
                tool, "Allow Resale to read the public Fashionphile and Rebag catalogues?",
                remember_key=PERMISSION_KEY):
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content("permission denied"))
            ctx.message("I need permission to read the public resale catalogues before I can answer.")
            return STOP_REFUSAL

        ctx.tool_call_update(tool, status="in_progress")
        try:
            answer, artifact = self._run_skill(skill, params)
        except (ResaleError, ValueError, GatewayError) as exc:
            ctx.tool_call_update(tool, status="failed", content=ctx.text_content(str(exc)))
            ctx.message(f"I could not read the resale catalogues: {exc}")
            return STOP_END_TURN
        ctx.check_cancelled()
        ctx.tool_call_update(tool, status="completed", content=ctx.text_content(artifact["summary"]))
        ctx.stream_text(answer)
        return STOP_END_TURN

    def on_cancel(self, session) -> None:
        # Every skill is a few HTTP reads; nothing long-running to interrupt.
        return None

    # -- skills ------------------------------------------------------------

    def _run_skill(self, skill: str, params: dict) -> tuple[str, dict]:
        if skill == "resale-search":
            return self._search(params)
        if skill == "brand-market":
            return self._market(params)
        if skill == "piece-lookup":
            return self._piece(params)
        if skill == "price-index":
            return self._index(params)
        return HELP, {"summary": "help", "dataset": None}

    @staticmethod
    def _line(row: dict) -> str:
        parts = [row.get("title") or "untitled"]
        if row.get("vendor"):
            parts.append(row["vendor"])
        parts.append(usd(row.get("price")))
        if row.get("type"):
            parts.append(row["type"])
        return " — ".join(parts)

    def _search(self, params: dict) -> tuple[str, dict]:
        brand = params.get("brand")
        keyword = params.get("keyword")
        if not brand and not keyword:
            return (
                "Tell me a brand or a word to look for — 'chanel flap', 'rolex submariner', "
                "'cartier bracelet' — and I will read both catalogues.",
                {"summary": "nothing to search for", "known": False},
            )
        try:
            result = self.data.search(brand, keyword)
        except ResaleError:
            # The catalogues write singular titles ("... Necklace"), so a plural ask gets one retry.
            retry = " ".join(singular(word) for word in (keyword or "").split())
            try:
                if retry and retry.lower() != (keyword or "").lower():
                    result = self.data.search(brand, retry)
                else:
                    raise
            except ResaleError:
                if brand:
                    raise
                # A word with no brand that matches nothing is a greeting or a stray word, not
                # a failed lookup: ask for something to look for instead of reporting an outage.
                return (
                    "Tell me a brand or a word to look for — 'chanel flap', 'rolex submariner', "
                    "'cartier bracelet' — and I will read both catalogues.",
                    {"summary": f"nothing matched {keyword!r}", "known": False},
                )
        rows = result["rows"]
        what = " and ".join(part for part in (brand, keyword) if part)
        artifact = {
            "summary": f"{what}: {len(rows)} listings, {usd(rows[0].get('price'))} to "
                       f"{usd(rows[-1].get('price'))} ({', '.join(result['sources'])})",
            "brand": result["brand"],
            "keyword": result["keyword"],
            "sources": result["sources"],
            "read": result["read"],
            "rows": rows,
        }
        lines = [f"Cheapest matches for {what} across Fashionphile and Rebag:"]
        for row in rows:
            lines.append(f"  • {self._line(row)}")
            condition = row.get("condition")
            state = "available" if row.get("available") else "sold, still listed"
            lines.append(f"    {state}; condition: {condition or 'not reported'}"
                         + (f"; {row['source'].split('.')[0]}" if row.get("source") else ""))
            if row.get("url"):
                lines.append(f"    {row['url']}")
        lines.append(
            f"\nSource: {', '.join(result['sources'])} (read live, {result['read']:,} products "
            "scanned). Rebag states a condition per listing; Fashionphile does not publish one in "
            "its catalogue JSON, so those rows say so."
        )
        return "\n".join(lines), artifact

    def _market(self, params: dict) -> tuple[str, dict]:
        brand = params.get("brand")
        if not brand:
            return (
                "Which brand's market should I read — chanel, hermes, gucci, prada, dior, "
                "saint laurent, balenciaga, bottega veneta, cartier, rolex, louis vuitton, tiffany?",
                {"summary": "no brand given", "known": False},
            )
        market = self.data.brand_market(brand)
        artifact = {
            "summary": f"{market['brand']}: {market['count']} listings, median "
                       f"{usd(market['median'])}, {market['available']} available",
            "brand": market["brand"],
            "count": market["count"],
            "available": market["available"],
            "listed": market["listed"],
            "median": market["median"],
            "low": market["low"],
            "high": market["high"],
            "conditions": market["conditions"],
            "types": market["types"],
            "by_source": market["by_source"],
            "read": market["read"],
            "sources": market["sources"],
            "rows": market["rows"][:8],
        }
        lines = [f"The {market['brand']} resale market right now "
                 f"({market['read']:,} products scanned across "
                 f"{', '.join(market['sources'])}):"]
        lines.append(f"  • {market['count']} live listings: {market['available']} available, "
                     f"{market['listed']} sold-and-still-listed")
        lines.append(f"  • asking prices: {usd(market['low'])} to {usd(market['high'])}, "
                     f"median {usd(market['median'])}")
        if market["types"]:
            lines.append("  • most listed types: " + ", ".join(
                f"{name} ({count})" for name, count in market["types"].items()))
        if market["conditions"]:
            lines.append("  • conditions: " + ", ".join(
                f"{name} ({count})" for name, count in sorted(market["conditions"].items())))
        else:
            lines.append("  • conditions: not reported by these sources in the pages read")
        for row in market["rows"][:5]:
            lines.append(f"  • {self._line(row)} — {'available' if row['available'] else 'sold'}")
        lines.append(
            f"\nSource: {', '.join(market['sources'])} (read live). These are asking prices on a "
            "resale marketplace, not realised sale prices, and a sold listing stays in the "
            "catalogue — so I count availability rather than pretend the stock is all for sale."
        )
        return "\n".join(lines), artifact

    def _piece(self, params: dict) -> tuple[str, dict]:
        handle = params.get("handle")
        if not handle:
            return ("Give me a listing handle or a product URL and I will pull that one listing.",
                    {"summary": "no handle given", "known": False})
        sources = [params["source"]] if params.get("source") else [DATASET_FASHIONPHILE, DATASET_REBAG]
        errors = []
        for source in sources:
            try:
                row = self.data.listing(source, handle)
            except (ResaleError, ValueError) as exc:
                errors.append(f"{source.split('.')[0]}: {exc}")
                continue
            artifact = {
                "summary": f"{row['title']} — {row['vendor']} — {usd(row['price'])} "
                           f"({'available' if row['available'] else 'sold'})",
                "handle": handle,
                "source": source,
                "vendor": row["vendor"],
                "price": row["price"],
                "available": row["available"],
                "condition": row["condition"],
                "type": row["type"],
                "url": row["url"],
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
            lines.append(f"\nSource: {source.split('.')[0]} (read live).")
            return "\n".join(lines), artifact
        raise ResaleError("; ".join(errors) or "no catalogue has that handle")

    def _index(self, params: dict) -> tuple[str, dict]:
        """Premium: the cross-brand index is computed on the gateway, not here."""
        brands = params.get("brands") or []
        if len(brands) < 2:
            return (
                "The premium index compares two to four brands at once — name them, like "
                "'compare chanel, gucci and prada'.",
                {"summary": "too few brands for the index", "known": False},
            )
        data, refused = premium_call(
            self.gateway,
            "resale_price_index",
            {"brands": brands[:4], "pages": 2},
            {"agent": "resale", "skill": "price-index", "brands": brands[:4]},
        )
        if refused:
            return refused
        board = data.get("brands") if isinstance(data, dict) else None
        if not isinstance(board, list) or not board:
            return empty_premium_answer(
                "The licence gateway returned no brands for that comparison, so I have nothing to "
                "report. Try two to four brand names from my list.",
                {"agent": "resale", "skill": "price-index"},
            )
        artifact = {
            "summary": f"premium index over {len(board)} brands: "
                       f"dearest median {usd((data.get('dearest') or {}).get('median'))}, "
                       f"most listed {data.get('mostListed', {}).get('brand')}",
            "premium": True,
            "brands": board,
            "scanned": data.get("scanned"),
            "dearest": data.get("dearest"),
            "cheapest": data.get("cheapest"),
            "most_listed": data.get("mostListed"),
        }
        lines = ["Premium cross-brand resale index (computed on the licence gateway):"]
        for entry in board:
            lines.append(
                f"  • {entry.get('brand')}: {entry.get('count')} listings "
                f"({entry.get('available')} available), median "
                f"{usd(entry.get('median'))}, range {usd(entry.get('low'))}–"
                f"{usd(entry.get('high'))} across {', '.join(entry.get('sources') or [])}"
            )
        dearest, cheapest = data.get("dearest") or {}, data.get("cheapest") or {}
        most = data.get("mostListed") or {}
        if board:
            lines.append(f"\nHighest median asking price: {dearest.get('brand')} at "
                         f"{usd(dearest.get('median'))}. Lowest: {cheapest.get('brand')} at "
                         f"{usd(cheapest.get('median'))}.")
            if most:
                lines.append(f"Most listings: {most.get('brand')} with {most.get('count')}.")
        lines.append(
            f"\nSource: the licence gateway read {data.get('scanned', 0):,} catalogue products "
            "across the two stores. Same catalogues as the free skills — the gateway adds the "
            "cross-brand comparison, and a caller without a key never gets the numbers."
        )
        return "\n".join(lines), artifact


def main(argv=None) -> int:
    import logging

    logging.basicConfig(level="INFO", stream=sys.stderr,
                        format="%(asctime)s %(levelname)s %(name)s %(message)s")
    try:
        ResaleAgent().run()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
