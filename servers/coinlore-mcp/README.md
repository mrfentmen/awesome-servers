# Coinlore MCP

CoinLore crypto market data: top coins, single coin, global stats, and markets. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools

* `tickers`  Top coins by market cap.
* `coin`  One coin by id.
* `globalStats`  Global crypto market stats.
* `markets`  Markets for a coin id.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

