# eveonline-mcp

Keyless EVE Online ESI: server status, universal search, characters, corporations, alliances, market prices.

## Setup

No API key needed.

## Tools

- `get_status` — EVE Online server status: online players, server version, start time.
- `search` — Universal EVE search across characters, corporations, alliances, items, systems and more.
- `get_character` — Public EVE character info: name, corporation, alliance, birthday, security status.
- `get_corporation` — Public EVE corporation info: name, ticker, alliance, member count, description.
- `get_alliance` — Public EVE alliance info: name, ticker, corporations, executor corp.
- `get_market_prices` — Universe-wide average and adjusted market prices for all EVE item types.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `faction_directory`
* `region_profile`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
