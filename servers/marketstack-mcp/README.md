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

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).
