# stadiumgoods-mcp

Query the Stadium Goods catalog (stadiumgoods.com, NYC): search sneakers and streetwear, newest arrivals, enriched product details (sizes), price stats, below-median deals, and category counts. Public storefront data, no API key required. Not affiliated with Stadium Goods.

## Tools

- `search_products` — Keyword search across the catalog.
- `list_newest` — Newest catalog products, sorted by publish date.
- `get_product` — Full details: variants with parsed options, images, description, tags.
- `price_overview` — Ask-price distribution (min/p25/median/p75/max).
- `find_deals` — Available products priced below the median.
- `list_categories` — Product-type counts in the catalog sample, e.g. how many sneakers, hoodies and accessories are listed.
- `list_collections` — Curated store collections with handles for browse_collection, e.g. sale or category collections.
- `browse_collection` — Listings inside one collection handle from list_collections, optionally only in-stock sizes.
- `find_by_size` — In-stock items in a size, with that size's price and the other sizes still in stock.

## Source

[stadiumgoods-mcp](https://github.com/mrfentmen/awesome-mcps/tree/main/servers/stadiumgoods-mcp)


