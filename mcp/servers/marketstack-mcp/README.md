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

These tools need a licence key:

* `symbol_dividend_ledger`
* `price_window_review`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
