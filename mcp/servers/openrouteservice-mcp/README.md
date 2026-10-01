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

These tools need a licence key:

* `osrm_route_steps`
* `valhalla_mode_compare`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
