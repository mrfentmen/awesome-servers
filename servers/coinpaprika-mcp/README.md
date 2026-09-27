# CoinPaprika MCP

CoinPaprika coin data from the public CoinPaprika API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `coin`  Details for one coin.
* `search`  Search coins.

* `ticker`
* `tickers`
* `markets`
* `ohlcv_today`
* `exchanges`
* `exchange_markets`
* `tags`
* `global_stats`
## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public CoinPaprika API.
