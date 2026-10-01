# marketstack-mcp

Marketstack API: end-of-day prices, historical EOD, ticker search, exchanges, dividends.

## Setup

```bash
export MARKETSTACK_API_KEY=...
```

## Tools

- `get_latest_eod` — Latest end-of-day open/high/low/close/volume for stock symbols.
- `get_eod_on_date` — End-of-day prices for symbols on one trading date.
- `search_tickers` — Search stock tickers by name or symbol: exchange, currency, MIC.
- `list_exchanges` — Stock exchanges covered by Marketstack with MIC codes and countries.
- `get_dividends` — Dividend declarations for symbols: amount, pay date, record date.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `symbol_dividend_ledger`
* `price_window_review`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-marketstack-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
