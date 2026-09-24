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

- `list_profiles`: Personal/business profiles with ids.
- `get_balances`: Balances per currency.
- `exchange_rate`: Mid-market rate between two currencies.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your token stays local and is only sent to Wise's API. All tools are read-only.
