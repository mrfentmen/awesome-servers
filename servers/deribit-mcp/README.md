# Deribit MCP

Deribit derivatives exchange: index prices, tickers, and supported indexes. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools

* `indexPrice`  Deribit index price.
* `ticker`  Deribit instrument ticker.
* `supported`  List supported index names.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

