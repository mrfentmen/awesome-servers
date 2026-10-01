# ns-mcp

NS Dutch Railways API: live departures, station search, journey planning, disruptions, fares.

## Setup

```bash
export NS_API_KEY=...
```

## Tools

- `get_departures` — Live NS departures from a station: times, platforms, train types, disruptions. Station codes like UT (Utrecht), ASD (Amsterdam).
- `search_stations` — Find NS stations by name or code: UIC codes, coordinates, synonyms.
- `plan_journey` — NS door-to-door journey advice: transfers, platforms, fares, disruptions between stations.
- `get_disruptions` — Current NS disruptions and engineering works with affected routes and alternative advice.
- `get_fares` — NS fares between two stations: single, return, discount options.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `station_network_census`
* `station_wikidata_profile`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
