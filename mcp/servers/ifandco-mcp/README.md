# ifandco-mcp

Query the IF & Co. catalog (ifandco.com, NYC): search custom pendants, chains, rings and bracelets, newest arrivals, enriched product details, price stats, below-median deals, and category counts. Public storefront data, no API key required. Not affiliated with IF & Co.

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

[ifandco-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/ifandco-mcp)

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `material_census`
* `personalisation_census`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
