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

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
