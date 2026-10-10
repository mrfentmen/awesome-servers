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
* `recent_trades`  Latest spot trades for a symbol with taker buy/sell split and VWAP over the window.
* `symbol_info`  Trading rules for one symbol: status, base/quote assets, tick size, step size, min notional and order types.
* `volume_leaders`  Busiest Binance pairs for a quote currency by 24h quote volume, with price change and share of volume.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Binance market data API. No account or key is needed.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `market_movers`
* `kline_indicators`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
