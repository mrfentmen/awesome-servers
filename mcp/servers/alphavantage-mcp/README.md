successfully downloaded text file (SHA: cb8999a8bd62106a95d135b311c377eaec1c2785)
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

- `stock_quote`: Quote with open/high/low, change, volume. Free tier is 25 calls/day.
- `fx_rate`: Currency exchange rate between two codes.
- `crypto_price`: Crypto price in a market currency.
- `symbol_search`: Find ticker symbols by company name, e.g. ibm.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to Alpha Vantage. Read-only.

## Tools

* `stockQuote`  Stock quote.
* `fxRate`  FX rate.
* `cryptoPrice`  Crypto price.
* `symbolSearch`  Symbol search.
* `priceHistory`  Price history.
* `companyProfile`  Company profile.
