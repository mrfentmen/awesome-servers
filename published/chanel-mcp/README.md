# chanel-mcp

Chanel resale listings aggregated from Fashionphile and Rebag public catalogs (prices in USD). No API key required. Condition/color/material attributes are parsed from Rebag catalog data (Fashionphile does not publish them); condition filters apply to Rebag data only. Not affiliated with or endorsed by Chanel; prices are asking prices, not appraisals.

## Tools

- `search_listings` — Keyword search across Fashionphile and Rebag. Condition filter is Rebag-data only.
- `list_newest` — Newest catalog listings, sorted by publish date.
- `get_listing` — Full details: variants, images, parsed condition/color/material, description.
- `price_overview` — Ask-price stats overall + by condition.
- `compare_prices` — Group same-model listings across sources with min/max/spread.
- `find_deals` — Available listings priced below the brand median.
- `brand_overview` — Catalog sample counts by source, type and condition.
- `list_collections` — Curated store collections with handles for browse_collection, e.g. sale or category collections.
- `browse_collection` — Listings inside one collection handle from list_collections, e.g. a sale or category collection.
- `find_by_attribute` — Listings filtered by color, exterior material or condition, plus the common values in the sample.

## Source

[chanel-mcp](https://github.com/mrfentmen/awesome-mcps/tree/main/servers/chanel-mcp)


