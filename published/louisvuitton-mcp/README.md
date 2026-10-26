# louisvuitton-mcp

Louis Vuitton resale listings aggregated from Fashionphile and Rebag public catalogs (prices in USD). No API key required. Condition/color/material attributes are parsed from Rebag catalog data (Fashionphile does not publish them); condition filters apply to Rebag data only. Not affiliated with or endorsed by Louis Vuitton; prices are asking prices, not appraisals.

## Tools

- `search_listings` — Keyword search across Fashionphile and Rebag. Condition filter is Rebag-data only.
- `list_newest` — Newest catalog listings, sorted by publish date.
- `get_listing` — Full details: variants, images, parsed condition/color/material, description.
- `price_overview` — Ask-price stats overall + by condition.
- `compare_prices` — Group same-model listings across sources with min/max/spread.
- `find_deals` — Available listings priced below the brand median.
- `brand_overview` — Catalog sample counts by source, type and condition.

## Source

[louisvuitton-mcp](https://github.com/mrfentmen/awesome-mcps/tree/main/servers/louisvuitton-mcp)

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
