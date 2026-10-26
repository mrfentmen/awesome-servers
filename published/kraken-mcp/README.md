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
* `recent_trades`  The tape: last trades with side, VWAP, buy/sell split and the largest print.
* `spread_history`  Bid/ask spread over recent quotes in absolute terms and basis points, with tightest and widest.
* `pair_details`  Trading rules for one pair: decimals, tick size, minimum order, leverage and fee tiers.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Kraken API.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `cross_exchange_price`
* `liquidity_map`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-kraken-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
