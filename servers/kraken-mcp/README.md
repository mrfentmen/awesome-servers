# Kraken MCP

Crypto prices from the public Kraken API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `ticker`  Ticker for one pair, e.g. XBTUSD.
* `assets`  Tradeable assets with decimals and status.
* `pairs`  How many trading pairs Kraken lists, with a 15-pair sample of wsname tickers. Full list omitted for size.
* `ohlc`  Last 10 candles for a pair as date plus open/high/low/close/volume rows.
* `depth`  Top of book for a pair as ask and bid price x volume rows.
* `time`  Kraken server time as RFC1123 string and epoch, useful for timestamping quotes.
* `status`  Whether Kraken reports itself online, with the status timestamp.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Kraken API.
