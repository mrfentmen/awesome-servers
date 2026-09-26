# Coinlore MCP

CoinLore crypto market data: top coins, single coin, global stats, and markets. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools

* `tickers`  Top coins by market cap, with price and 24h change.
* `coin`  One coin by its CoinLore id, e.g. 90 for Bitcoin.
* `globalStats`  Global crypto market stats: total cap, volume, Bitcoin share.
* `search_coins`  Find a coin by name or symbol among the top 100 by market cap, with its CoinLore id for the coin tool.
* `movers`  Biggest 24-hour gainers and losers among the top 100 coins by market cap.
* `markets`  Markets for a coin id across exchanges, e.g. 90 for Bitcoin.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

