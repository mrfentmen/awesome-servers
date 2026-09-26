# GeckoTerminal MCP

Token data from the public GeckoTerminal API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `token`  Token details by address on one network: price, supply, pool.
* `trending`  Pools with the most activity on GeckoTerminal right now.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public GeckoTerminal API.
