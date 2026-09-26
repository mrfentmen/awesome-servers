# Deribit MCP

Deribit derivatives exchange: index prices, tickers, and supported indexes. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools

* `indexPrice`  Deribit index price for one index name, e.g. btc_usd.
* `ticker`  Ticker for an instrument, e.g. BTC-PERPETUAL.
* `supported`  Index names Deribit publishes prices for.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

