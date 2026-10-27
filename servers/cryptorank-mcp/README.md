# CryptoRank MCP

Crypto rankings from the public CryptoRank API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `coins`  Ranked coins with market cap and 24h change.
* `coin`  One coin by its CryptoRank key, e.g. bitcoin.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public CryptoRank API.
