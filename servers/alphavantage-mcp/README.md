# Alpha Vantage MCP

MCP server for Alpha Vantage: stock quotes, forex, crypto. Needs a free API key.

Pairs well with `yfinance-mcp`, `twelvedata-mcp`, and `fred-mcp`.

## Quick start

Get a key at https://www.alphavantage.co/support/#api-key/ (free, 25 calls/day), then:

```bash
export ALPHAVANTAGE_API_KEY=your_key_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `stock_quote`: OHLC, change, volume.
- `fx_rate`: Currency pairs.
- `crypto_price`: Crypto in any market.
- `symbol_search`: Tickers by company.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to Alpha Vantage. Read-only.
