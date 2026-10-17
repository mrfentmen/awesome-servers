# glossier-mcp

Query the Glossier catalog (glossier.com, NYC): search beauty and skincare, newest arrivals, enriched product details (shades/sizes), price stats, below-median deals, and category counts. Public storefront data, no API key required. Not affiliated with Glossier.

## Tools

- `search_products` — Keyword search across the catalog.
- `list_newest` — Newest catalog products, sorted by publish date.
- `get_product` — Full details: variants with parsed options, images, description, tags.
- `price_overview` — Ask-price distribution (min/p25/median/p75/max).
- `find_deals` — Available products priced below the median.
- `list_categories` — Product-type counts in the catalog sample.
- `list_collections` — Collections with handle, product count and URL, longest first.
- `collection_products` — Every product in one collection with live price and stock, sortable.
- `restock_check` — Stock and price for specific product handles: what is buyable right now and which options are left.

## Source

[glossier-mcp](https://github.com/mrfentmen/awesome-mcps/tree/main/servers/glossier-mcp)


