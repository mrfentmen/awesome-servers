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

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
