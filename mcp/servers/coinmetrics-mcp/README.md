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

These tools need a license key:

* `asset_catalog`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-coinmetrics-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
