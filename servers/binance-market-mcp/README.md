# Binance Market MCP

Live crypto prices, tickers, and candlestick charts from the public Binance market data endpoint. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `ticker`  Get the 24 hour ticker for a symbol.
* `klines`  Get candlestick data for a symbol.
* `price`  Get the current price for a symbol.
* `book`  Best bid and ask with quantities for a symbol.
* `avg`  5-minute average price for a symbol.
* `depth`  Top bids and asks with quantities for a symbol.
* `markets`  How many symbols Binance lists with a TRADING count and a 12-symbol sample. Full list omitted for size.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Binance market data API. No account or key is needed.
