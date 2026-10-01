# coinmetrics-mcp

Keyless Coin Metrics community data: asset metrics time series and catalogs.

## Setup

No API key needed.

Uses the free Community API (10 requests per 6 seconds, non-commercial).

## Tools

- `get_asset_metrics` — Coin Metrics time series, e.g. assets 'btc,eth', metrics 'PriceUSD', frequency '1d'.
- `list_metrics` — Coin Metrics metric catalog for assets with availability windows.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `asset_catalog`
* `pair_candles`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
