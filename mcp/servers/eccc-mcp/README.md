# eccc-mcp

Keyless Environment Canada weather/climate/water data via MSC GeoMet OGC APIs.

## Setup

No API key needed.

## Tools

- `list_collections` — All MSC GeoMet collections: weather, climate, water datasets and products.
- `get_collection` — Metadata for one GeoMet collection: description, links, extent.
- `query_collection` — Query items in a GeoMet collection with optional bounding box.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `search_collections`
* `nearest_items`
* `item_detail`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
