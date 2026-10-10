# peakdesign-mcp

Query the Peak Design catalog (peakdesign.com): search bags and camera gear, newest arrivals, enriched product details, price stats, below-median deals, and category counts. Public storefront data, no API key required. Not affiliated with Peak Design.

## Tools

- `search_products` — Keyword search across the catalog.
- `list_newest` — Newest catalog products, sorted by publish date.
- `get_product` — Full details: variants with parsed options, images, description, tags.
- `price_overview` — Ask-price distribution (min/p25/median/p75/max).
- `find_deals` — Available products priced below the median.
- `list_categories` — Product-type counts in the catalog sample.

## Source

[peakdesign-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/peakdesign-mcp)

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `collection_variants`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
