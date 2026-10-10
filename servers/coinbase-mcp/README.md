# Coinbase MCP

Crypto prices from the public Coinbase API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `spot`  Latest spot price for one pair, e.g. BTC-USD.
* `exchange`  Crypto-to-fiat exchange rates for one base currency.
* `buy`  Coinbase buy price for a pair, returns base, currency and amount.
* `sell`  Coinbase sell price for a pair, returns base, currency and amount.
* `currencies`  How many currencies Coinbase supports with a fiat count and a 15-code sample. Full list omitted for size.
* `time`  Coinbase server time as ISO string and epoch, useful for timestamping quotes.
* `exchange_stats`  Coinbase Exchange 24h open, high, low, last and volume for a product, with the day's range.
* `candles`  Coinbase Exchange OHLCV candles for a product at 1m to 1d granularity, with the period change.
* `exchange_ticker`  Live Coinbase Exchange ticker: price, bid/ask, spread, 24h volume and last trade id.
* `order_book`  Coinbase Exchange level-2 book: top bids and asks with sizes, order counts and the spread.
* `trading_products`  Coinbase Exchange products for a quote currency, e.g. every USD or USDT market, with online status.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Coinbase API.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `product_info`
* `recent_trades`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
