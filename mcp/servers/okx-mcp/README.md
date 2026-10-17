# OKX MCP

Crypto prices from the public OKX API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `ticker`  Current price for a pair.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public OKX API.


