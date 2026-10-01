# Tiingo MCP

MCP server for Tiingo: stocks, forex, crypto. Needs a free API token.

Pairs well with `alphavantage-mcp`, `yfinance-mcp`, and `fred-mcp`.

## Quick start

Get a token at https://www.tiingo.com/ (free), then:

```bash
export TIINGO_API_TOKEN=your_token_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `stock_meta`: Stock name, exchange, data range.
- `stock_prices`: Recent daily OHLCV prices, newest first.
- `crypto_meta`: Name and base currency behind a crypto ticker, e.g. btcusd.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your token stays local and is only sent to Tiingo. Read-only.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `drawdown_profile`
* `return_correlation`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-tiingo-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
