# Finnhub MCP

MCP server for Finnhub: quotes, company news, earnings. Free key.

Pairs well with `alphavantage-mcp`, `yfinance-mcp`, and `fred-mcp`.

## Setup

Get a key at https://finnhub.io/ (free), then:

```bash
export FINNHUB_API_KEY=your_key_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `stock_quote`: Price, change, day range.
- `company_news`: Headlines with links.
- `earnings_calendar`: Dates with EPS estimates.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to Finnhub. Read-only.
