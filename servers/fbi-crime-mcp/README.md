# fbi-crime-mcp

Query the FBI Crime Data API (free key; set FBI_API_KEY from api.data.gov): arrests, offenses, victims by state.

## Tools

- `arrests` — Arrest estimates by state, offense and year.
- `offenses` — Offense counts by state and offense type.
- `victims` — Victim demographics by state and offense.

## Source

[fbi-crime-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/fbi-crime-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `state_comparison`
* `crime_trend`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-fbi-crime-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
