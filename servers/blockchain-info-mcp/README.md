# Blockchain Info MCP

Bitcoin data from blockchain.info: price ticker, latest block, and address balances. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools

* `ticker`  Bitcoin price across currencies.
* `latestBlock`  Latest Bitcoin block.
* `address`  Bitcoin address balance and recent txs.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

