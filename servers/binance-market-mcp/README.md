# Binance Market MCP

Live crypto prices, tickers, and candlestick charts from the public Binance market data endpoint. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `ticker`  24 hour ticker for a symbol.
* `klines`  Candlestick data.
* `price`  Current price.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Binance market data API. No account or key is needed.
