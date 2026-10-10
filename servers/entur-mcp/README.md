# entur-mcp

Keyless Entur Norway: stop autocomplete, reverse geocode, departures, door-to-door trip planning.

## Setup

No API key needed.

## Tools

- `autocomplete_stop` — Find Norwegian stops and stations by name: Oslo S, Bergen, Trondheim S.
- `reverse_geocode` — Nearest Norwegian stops and addresses for coordinates.
- `get_departures` — Live departures from a Norwegian stop place: lines, destinations, realtime times.
- `plan_trip` — Door-to-door Norway trip: trains, buses, trams, ferries with legs, times and lines.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `quays_nearby`
* `stop_details`
* `service_alerts`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
