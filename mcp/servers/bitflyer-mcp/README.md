# Bitflyer MCP

BitFlyer Japan crypto exchange: tickers, order books, and markets. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools

* `ticker`  BitFlyer ticker for a product.
* `board`  BitFlyer order book depth.
* `markets`  List BitFlyer spot markets.

## Usage

```bash
npm install
npm run build
node dist/index.js
```


