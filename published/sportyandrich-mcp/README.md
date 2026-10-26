# sportyandrich-mcp

Query the Sporty & Rich catalog (sportyandrich.com): search clothing, newest arrivals, enriched product details, price stats, below-median deals, and category counts. Public storefront data, no API key required. Not affiliated with Sporty & Rich.

## Tools

- `search_products` — Keyword search across the catalog.
- `list_newest` — Newest catalog products, sorted by publish date.
- `get_product` — Full details: variants with parsed options, images, description, tags.
- `price_overview` — Ask-price distribution (min/p25/median/p75/max).
- `find_deals` — Available products priced below the median.
- `list_categories` — Product-type counts in the catalog sample.

## Source

[sportyandrich-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/sportyandrich-mcp)

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
