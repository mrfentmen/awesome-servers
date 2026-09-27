# Deribit MCP

Deribit derivatives exchange: index prices, tickers, and supported indexes. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools

* `indexPrice`  Deribit index price for one index name, e.g. btc_usd.
* `ticker`  Ticker for an instrument, e.g. BTC-PERPETUAL.
* `supported`  Index names Deribit publishes prices for.
* `book`  Bids and asks with quantities for an instrument.
* `instruments`  How many live instruments a currency and kind has, with a 10-name sample. Full list omitted for size.
* `trades`  Most recent trades for an instrument as time, direction, amount and price rows.
* `summary`  Per-future last, mark and open interest rows for a currency.
* `funding_rate_history`  Perpetual funding rate history with latest, average and annualised rate for an instrument.
* `historical_volatility`  Deribit's historical volatility series for a currency: latest, 7-day average and full range.
* `options_summary`  Option chain overview: calls vs puts, expiries and the instruments with the most open interest.
* `currencies`  Every currency Deribit lists for trading, with the count per coin type.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

