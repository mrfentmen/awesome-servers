# Wise MCP

MCP server for Wise: profiles, balances, exchange rates. Needs a free Wise API token.

## Setup

Create a token in your Wise account (Settings > API tokens), then:

```bash
export WISE_API_TOKEN=your_token_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_profiles`: Your Wise profiles (personal, business) with ids.
- `get_balances`: Balances per currency for one Wise profile.
- `exchange_rate`: Current Wise mid-market rate between two currencies.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your token stays local and is only sent to Wise's API. All tools are read-only.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `incident_history`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
