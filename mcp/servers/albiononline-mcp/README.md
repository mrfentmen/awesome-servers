# albiononline-mcp

Keyless Albion Online data: live market prices, price history, gold prices, killboard events.

## Setup

No API key needed.

## Tools

- `get_prices` — Live Albion Online market prices for an item across cities, sell and buy orders.
- `get_price_history` — Albion Online price history rows for an item: timestamps, min/max/avg prices, volumes.
- `get_price_charts` — Albion Online chart-ready price series (locations and item count series) for an item.
- `get_gold_prices` — Albion Online gold prices over time.
- `get_recent_kills` — Recent Albion Online killboard events: killers, victim, gear, fame.
- `get_kill_details` — Full Albion Online kill event: participants, equipment snapshots, damage done.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `market_summary`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
