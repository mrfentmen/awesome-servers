# Kraken MCP

Crypto prices from the public Kraken API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `ticker`  Ticker for one pair, e.g. XBTUSD.
* `assets`  Tradeable assets with decimals and status.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Kraken API.
