"""Read-only reader for the Fashionphile and Rebag resale catalogues.

  https://www.fashionphile.com/products.json    Fashionphile  (Shopify catalogue)
  https://shop.rebag.com/products.json           Rebag         (Shopify catalogue)
  https://www.fashionphile.com/products/<handle>.js          one listing
  https://shop.rebag.com/products/<handle>.js                one listing

Both catalogues are keyless Shopify storefronts, verified live on 2026-09-30 from this repo
(250 products on page one of each; Chanel, Hermes, Gucci, Prada, Louis Vuitton, Christian Dior,
Saint Laurent, Tiffany & Co. and Rolex all present with real variant prices).

Two things the two feeds do not agree on, and this reader refuses to paper over:

  - **Condition.** Rebag states it in the variant title ("Very Good | Item # 435909/1 / green").
    Fashionphile states it nowhere in the catalogue JSON, so its listings report condition as
    "not reported" instead of borrowing a word from the other store.
  - **Availability.** A listing can be sold while it stays in the catalogue, so every row carries
    the variant's own `available` flag and a market read counts both states.

Prices come from the variant, never from the body text. A title with "$" in it is a title.

Pagination is the stores' own: `/products.json?limit=250&page=N`. A page past the end answers an
empty `products` array rather than an error, so a short read is a short read, not an outage.
"""

from __future__ import annotations

import html as html_module
import json
import os
import re
import statistics
from typing import Any
from urllib import parse, request

from a2a_kit import JsonApiClient, UpstreamError

DATASET_FASHIONPHILE = "fashionphile.com/products.json"
DATASET_REBAG = "shop.rebag.com/products.json"

DATASETS = (DATASET_FASHIONPHILE, DATASET_REBAG)

#: Where each dataset actually lives. Two stores, one reader.
HOSTS = {
    DATASET_FASHIONPHILE: "https://www.fashionphile.com",
    DATASET_REBAG: "https://shop.rebag.com",
}

#: Human names for the two catalogues, so an answer can name its source instead of its URL.
STORE_NAMES = {
    DATASET_FASHIONPHILE: "Fashionphile",
    DATASET_REBAG: "Rebag",
}

DEFAULT_USER_AGENT = "a2a-resale/1.0 (+https://github.com/mrfentmen/a2a)"

#: Shopify's own maximum for one catalogue page.
PAGE_SIZE = 250
DEFAULT_PAGES = 2
MAX_PAGES = 4
DEFAULT_LIMIT = 5
MAX_LIMIT = 12

#: Condition words Rebag uses as the variant-title prefix. Anything else is not a condition.
CONDITIONS = ("pristine", "excellent", "very good", "good", "fair", "new")

#: canonical brand -> the spellings a person actually types. The vendors in the catalogues
#: are "Hermes", "Christian Dior", "Saint Laurent", "Tiffany & Co." and so on.
KNOWN_BRANDS: dict[str, tuple[str, ...]] = {
    "chanel": ("chanel",),
    "hermes": ("hermes", "hermès"),
    "gucci": ("gucci",),
    "prada": ("prada",),
    "dior": ("dior", "christian dior"),
    "saint laurent": ("saint laurent", "yves saint laurent", "ysl"),
    "balenciaga": ("balenciaga",),
    "bottega veneta": ("bottega veneta", "bottega"),
    "cartier": ("cartier",),
    "rolex": ("rolex",),
    "louis vuitton": ("louis vuitton", "vuitton", "lv"),
    "tiffany": ("tiffany & co", "tiffany and co", "tiffany"),
}

#: vendor values the catalogues use for each canonical brand, so a "chanel" search still
#: matches a vendor written "Chanel" - and "christian dior" matches "dior".
VENDOR_MATCHERS: dict[str, tuple[str, ...]] = {
    "chanel": ("chanel",),
    "hermes": ("hermes",),
    "gucci": ("gucci",),
    "prada": ("prada",),
    "dior": ("dior",),
    "saint laurent": ("saint laurent",),
    "balenciaga": ("balenciaga",),
    "bottega veneta": ("bottega veneta", "bottega"),
    "cartier": ("cartier",),
    "rolex": ("rolex",),
    "louis vuitton": ("louis vuitton",),
    "tiffany": ("tiffany",),
}

_WS_RE = re.compile(r"\s+")


def money(value) -> float | None:
    """A variant price as a float, or None. Shopify sends prices as strings."""
    if value is None:
        return None
    try:
        price = float(str(value).strip())
    except (TypeError, ValueError):
        return None
    return price if price >= 0 else None


def condition_from_variant(variant_title) -> str | None:
    """Rebag puts the condition in front of the variant title. Fashionphile does not.

    "Very Good | Item # 435909/1 / green" -> "very good". "Default Title" -> None.
    """
    title = str(variant_title or "").strip()
    if not title or "|" not in title:
        return None
    head = title.split("|", 1)[0].strip().lower()
    return head if head in CONDITIONS else None


def brand_key(name: str) -> str:
    """Normalise a brand for comparison: 'Christian Dior' and 'dior' are the same brand.

    Trailing punctuation is dropped so the catalogues' 'Tiffany & Co.' matches 'tiffany'.
    """
    text = _WS_RE.sub(" ", str(name or "").strip().lower()).replace(".", "").strip()
    for canonical, aliases in KNOWN_BRANDS.items():
        if text in aliases:
            return canonical
    return text


def brands_in_text(text: str) -> list[str]:
    """Every known brand named in a sentence, in the order the sentence names them."""
    lowered = _WS_RE.sub(" ", str(text or "").lower())
    found: list[str] = []
    for canonical, aliases in KNOWN_BRANDS.items():
        for alias in aliases:
            if re.search(rf"(?<![a-z]){re.escape(alias)}(?![a-z])", lowered):
                found.append(canonical)
                break
    return found


def plain_text(html) -> str | None:
    """A store's description with its tags stripped, or None when it sent none."""
    if not html:
        return None
    text = re.sub(r"<[^>]+>", " ", str(html))
    text = html_module.unescape(text)
    text = _WS_RE.sub(" ", text).strip()
    return text[:600] or None


class ResaleClient(JsonApiClient):
    """Search, per-brand market reads and single-listing lookups over two resale catalogues."""

    env_prefix = "RESALE"
    user_agent = DEFAULT_USER_AGENT

    def __init__(self, fetch=None, cache_ttl: float | None = None, timeout: float | None = None,
                 user_agent: str | None = None) -> None:
        super().__init__(
            fetch=fetch,
            cache_ttl=cache_ttl if cache_ttl is not None else float(os.environ.get("RESALE_CACHE_TTL", "600")),
            timeout=timeout if timeout is not None else float(os.environ.get("RESALE_HTTP_TIMEOUT", "25")),
            headers={"Accept": "application/json"},
        )
        if user_agent:
            self.user_agent = user_agent

    # -- validation --------------------------------------------------------

    @staticmethod
    def check_source(value: str | None) -> str:
        source = str(value or "").strip()
        if source not in DATASETS:
            raise ValueError(f"a source is one of {', '.join(DATASETS)}")
        return source

    @staticmethod
    def check_brand(value: str) -> str:
        brand = _WS_RE.sub(" ", str(value or "").strip().lower())
        if len(brand) < 2 or not any(ch.isalpha() for ch in brand):
            raise ValueError("a brand is a name, like 'chanel' or 'rolex'")
        if len(brand) > 40:
            raise ValueError("keep the brand to a name or two")
        return brand

    @staticmethod
    def check_query(value: str) -> str:
        query = _WS_RE.sub(" ", str(value or "").strip())
        if len(query) < 2 or not any(ch.isalnum() for ch in query):
            raise ValueError("a search is a word or two, like 'birkin' or 'tote'")
        if len(query) > 60:
            raise ValueError("keep the search to a few words")
        return query

    @staticmethod
    def check_handle(value: str) -> str:
        handle = str(value or "").strip().strip("/")
        if handle.startswith("http"):
            handle = handle.rstrip("/").rsplit("/", 1)[-1]
        if ".js" in handle:
            handle = handle.split(".js", 1)[0]
        if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{3,120}", handle):
            raise ValueError("a listing handle looks like 'handbags-hermes-maxibox-bag-294167871'")
        return handle

    @staticmethod
    def check_pages(value) -> int:
        try:
            pages = int(value)
        except (TypeError, ValueError):
            pages = DEFAULT_PAGES
        return max(1, min(pages, MAX_PAGES))

    @staticmethod
    def check_limit(value) -> int:
        try:
            limit = int(value)
        except (TypeError, ValueError):
            limit = DEFAULT_LIMIT
        return max(1, min(limit, MAX_LIMIT))

    # -- catalogue ---------------------------------------------------------

    def products(self, source: str, page: int = 1) -> list[dict]:
        """One catalogue page from one store, as the store sent it."""
        if source not in HOSTS:
            raise UpstreamError(f"unknown resale source {source!r}")
        try:
            payload = self.get_json(
                f"{HOSTS[source]}/products.json",
                {"limit": str(PAGE_SIZE), "page": str(page)},
            )
        except UpstreamError as exc:
            raise UpstreamError(f"{source}: {exc}") from exc
        if not isinstance(payload, dict) or not isinstance(payload.get("products"), list):
            raise UpstreamError(f"{source} returned an unexpected payload (no product list)")
        return payload["products"]

    @staticmethod
    def slim(source: str, product: dict) -> dict:
        """One catalogue product as the answer needs it. Missing fields stay missing."""
        variants = product.get("variants") or []
        prices = [money(variant.get("price")) for variant in variants]
        prices = [price for price in prices if price is not None]
        condition = None
        for variant in variants:
            condition = condition_from_variant(variant.get("title"))
            if condition:
                break
        handle = str(product.get("handle") or "")
        images = product.get("images") or []
        # The two Shopify endpoints disagree here: /products.json sends image objects, while
        # /products/<handle>.js sends the URLs as bare strings.
        first_image = images[0] if images else None
        image = (first_image.get("src") if isinstance(first_image, dict)
                 else str(first_image) if first_image else None)
        return {
            "source": source,
            "title": str(product.get("title") or "").strip(),
            "vendor": str(product.get("vendor") or "").strip(),
            "type": str(product.get("product_type") or "").strip() or None,
            "handle": handle,
            "price": min(prices) if prices else None,
            "variants": len(variants),
            "available": any(bool(variant.get("available")) for variant in variants),
            "condition": condition,
            "url": f"{HOSTS[source]}/products/{handle}" if handle else None,
            "image": image,
        }

    def scan(self, brand: str | None = None, keyword: str | None = None,
             pages: int = DEFAULT_PAGES, sources: tuple[str, ...] = DATASETS) -> dict:
        """Filter the catalogues by brand and/or keyword. Reports how much was actually read."""
        wanted_brand = brand_key(brand) if brand else None
        vendor_needles = VENDOR_MATCHERS.get(wanted_brand or "", (wanted_brand or "",)) if wanted_brand else ()
        needle = (keyword or "").strip().lower()
        page_count = self.check_pages(pages)
        rows: list[dict] = []
        seen: set[tuple[str, str]] = set()
        read = 0
        answered: list[str] = []
        errors: list[str] = []
        for source in sources:
            for page in range(1, page_count + 1):
                try:
                    products = self.products(source, page)
                except UpstreamError as exc:
                    errors.append(str(exc))
                    break
                if not products:
                    break
                answered.append(source)
                read += len(products)
                for product in products:
                    row = self.slim(source, product)
                    # A store can repeat a product across pages; one listing is one listing.
                    if (source, row["handle"]) in seen:
                        continue
                    seen.add((source, row["handle"]))
                    vendor = row["vendor"].lower()
                    if vendor_needles and not any(needle_ in vendor for needle_ in vendor_needles):
                        continue
                    if needle and needle not in f"{row['title']} {row['type'] or ''}".lower():
                        continue
                    rows.append(row)
        if not answered:
            raise UpstreamError("no resale catalogue answered (" + "; ".join(errors or ["no pages read"]) + ")")
        rows.sort(key=lambda row: (row["price"] is None, row["price"] if row["price"] is not None else 0.0))
        return {"rows": rows, "read": read, "sources": sorted(set(answered)), "pages": page_count}

    def search(self, brand: str | None, keyword: str | None, limit: int = DEFAULT_LIMIT) -> dict:
        """The best matches for a brand and/or a word, cheapest first. Empty row list = no match."""
        name = self.check_brand(brand) if brand else None
        word = self.check_query(keyword) if keyword else None
        if not name and not word:
            raise ValueError("give me a brand, a word, or both")
        count = self.check_limit(limit)
        result = self.scan(name, word)
        return {"brand": name, "keyword": word, "rows": result["rows"][:count],
                "read": result["read"], "sources": result["sources"]}

    def listing(self, source: str, handle: str) -> dict:
        """One listing by handle, read from the store's own product endpoint."""
        self.check_source(source)
        clean = self.check_handle(handle)
        try:
            payload = self.get_json(f"{HOSTS[source]}/products/{clean}.js", {})
        except UpstreamError as exc:
            raise UpstreamError(f"{source}: {exc}") from exc
        if not isinstance(payload, dict) or not payload.get("title"):
            raise UpstreamError(f"{source} has nothing at that handle")
        row = self.slim(source, payload)
        # Same disagreement as the images: /products.json calls it body_html, the listing
        # endpoint calls it description.
        row["description"] = plain_text(payload.get("body_html") or payload.get("description"))
        return row

    def brand_market(self, brand: str, pages: int = DEFAULT_PAGES) -> dict:
        """What one brand's resale market looks like right now: counts, spread, conditions."""
        name = self.check_brand(brand)
        result = self.scan(name, None, pages=pages)
        rows = [row for row in result["rows"] if brand_key(row["vendor"]) == name]
        prices = [row["price"] for row in rows if row["price"] is not None]
        conditions: dict[str, int] = {}
        for row in rows:
            if row["condition"]:
                conditions[row["condition"]] = conditions.get(row["condition"], 0) + 1
        types: dict[str, int] = {}
        for row in rows:
            if row["type"]:
                types[row["type"]] = types.get(row["type"], 0) + 1
        by_source: dict[str, int] = {}
        for row in rows:
            by_source[row["source"]] = by_source.get(row["source"], 0) + 1
        return {
            "brand": name,
            "rows": rows,
            "count": len(rows),
            "available": sum(1 for row in rows if row["available"]),
            "listed": sum(1 for row in rows if not row["available"]),
            "priced": len(prices),
            "low": min(prices) if prices else None,
            "high": max(prices) if prices else None,
            "median": statistics.median(prices) if prices else None,
            "conditions": conditions,
            "types": dict(sorted(types.items(), key=lambda item: -item[1])[:5]),
            "by_source": by_source,
            "read": result["read"],
            "sources": result["sources"],
        }


__all__ = [
    "CONDITIONS",
    "DATASET_FASHIONPHILE",
    "DATASET_REBAG",
    "DATASETS",
    "DEFAULT_LIMIT",
    "DEFAULT_PAGES",
    "DEFAULT_USER_AGENT",
    "HOSTS",
    "KNOWN_BRANDS",
    "MAX_LIMIT",
    "MAX_PAGES",
    "PAGE_SIZE",
    "STORE_NAMES",
    "VENDOR_MATCHERS",
    "ResaleClient",
    "UpstreamError",
    "brand_key",
    "brands_in_text",
    "condition_from_variant",
    "money",
    "plain_text",
]
