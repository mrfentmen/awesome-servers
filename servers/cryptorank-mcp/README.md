# CryptoRank MCP

Crypto rankings from the public CryptoRank API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `coins`  List ranked coins.
* `coin`  Get a coin.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public CryptoRank API.
