# aimeleondore-mcp

Query the Aimé Leon Dore catalog (aimeleondore.com, NYC): search menswear, newest arrivals, enriched product details (sizes/colors), price stats, below-median deals, and category counts. Public storefront data, no API key required. Not affiliated with Aimé Leon Dore.

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

[aimeleondore-mcp](https://github.com/mrfentmen/awesome-mcps/tree/main/servers/aimeleondore-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `shop_info`
* `list_pages`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-aimeleondore-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
