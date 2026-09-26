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

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Coinbase API.
