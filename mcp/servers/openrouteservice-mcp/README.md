# openrouteservice-mcp

Query OpenRouteService (free key; set OPENROUTESERVICE_API_KEY): geocode, reverse geocode, driving directions.

## Tools

- `geocode` — Coordinates for a place name, e.g. Berlin.
- `reverse` — Nearest place name for latitude and longitude.
- `directions` — Driving route between two points, with distance and time.

## Source

[openrouteservice-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/openrouteservice-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `osrm_route_steps`
* `valhalla_mode_compare`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-openrouteservice-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
