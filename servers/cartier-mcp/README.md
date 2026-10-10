# cartier-mcp

Cartier resale listings aggregated from Fashionphile and Rebag public catalogs (prices in USD). No API key required. Condition/color/material attributes are parsed from Rebag catalog data (Fashionphile does not publish them); condition filters apply to Rebag data only. Not affiliated with or endorsed by Cartier; prices are asking prices, not appraisals.

## Tools

- `search_listings` — Keyword search across Fashionphile and Rebag. Condition filter is Rebag-data only.
- `list_newest` — Newest catalog listings, sorted by publish date.
- `get_listing` — Full details: variants, images, parsed condition/color/material, description.
- `price_overview` — Ask-price stats overall + by condition.
- `compare_prices` — Group same-model listings across sources with min/max/spread.
- `find_deals` — Available listings priced below the brand median.
- `brand_overview` — Catalog sample counts by source, type and condition.

## Source

[cartier-mcp](https://github.com/mrfentmen/awesome-mcps/tree/main/servers/cartier-mcp)

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `list_store_collections`
* `collection_cartier_items`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
