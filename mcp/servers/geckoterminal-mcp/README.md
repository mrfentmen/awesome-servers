# GeckoTerminal MCP

Token data from the public GeckoTerminal API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `token`  Token details by address on one network: price, supply, pool.
* `trending`  Pools with the most activity on GeckoTerminal right now.
* `networks`  Blockchains GeckoTerminal tracks, with a 20-network sample. Full list omitted for size.
* `pool`  One pool by id with base/quote USD prices and reserves. Get ids from search.
* `newPools`  Recently listed pools on a network with prices and volumes.
* `search`  Search pools by text across networks, returns ids for the pool tool.
* `token_pools`  Every pool a token trades in on one network, biggest liquidity first, with price, reserves and 24h volume.
* `token_prices`  Batch spot prices for up to 30 token addresses on one network in a single call.
* `dexes`  Decentralised exchanges tracked on a network, with the number of pools each has.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public GeckoTerminal API.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `pool_ohlc`
* `pool_trades`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
