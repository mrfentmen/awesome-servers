# openchargemap-mcp

Search Open Charge Map (free key; set OPENCHARGEMAP_API_KEY, query param): chargers near coordinates, details.

## Tools

- `nearby` — Charging points near coordinates, with distance.
- `get_poi` — One charge point by id, with connectors and operator.

## Source

[openchargemap-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/openchargemap-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `osm_chargers_nearby`
* `charger_coverage_gap`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-openchargemap-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
