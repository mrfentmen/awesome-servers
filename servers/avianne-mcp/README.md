# avianne-mcp

Query the Avianne & Co. catalog (avianneandco.com, NYC Diamond District): search engagement rings, wedding bands, watches and jewelry, newest arrivals, enriched product details, price stats, below-median deals, and category counts. Public storefront data, no API key required. Not affiliated with Avianne.

## Tools

- `search_products` — Keyword search across the catalog.
- `list_newest` — Newest catalog products, sorted by publish date.
- `get_product` — Full details: variants with parsed options, images, description, tags.
- `price_overview` — Ask-price distribution (min/p25/median/p75/max).
- `find_deals` — Available products priced below the median.
- `list_categories` — Product-type counts in the catalog sample.
- `list_collections` — Every store collection with its handle, for browse_collection, e.g. shop-all, accessories, uniform.
- `browse_collection` — Listings inside one collection handle from list_collections, optionally only items in stock in a size.
- `find_by_size` — In-stock items in a size, with that size's price and the other sizes still in stock.

## Source

[avianne-mcp](https://github.com/mrfentmen/awesome-servers/tree/main/servers/avianne-mcp)
