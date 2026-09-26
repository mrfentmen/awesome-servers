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

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public GeckoTerminal API.
