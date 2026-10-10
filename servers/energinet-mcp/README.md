# energinet-mcp

Keyless Danish Energinet electricity data: live power system plus any open dataset.

## Setup

No API key needed.

## Tools

- `get_power_now` — Live Danish power system: production, consumption, exchange right now.
- `get_dataset` — Rows from any Energinet open dataset by name.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

<!-- paywall -->
## Premium tools

These tools need a license key:

* `day_ahead_prices`
* `carbon_trend`
* `exchange_balance`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-energinet-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
