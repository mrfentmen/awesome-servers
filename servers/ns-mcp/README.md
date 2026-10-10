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

These tools need a license key:

* `station_network_census`
* `station_wikidata_profile`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-ns-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
