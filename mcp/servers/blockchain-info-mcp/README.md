# Blockchain Info MCP

Bitcoin data from blockchain.info: price ticker, latest block, and address balances. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools

* `ticker`  Bitcoin price in USD, EUR, GBP, JPY and BTC, with buy/sell spreads.
* `latest_block`  The latest Bitcoin block: height, hash, mining time and transaction count.
* `network_stats`  Bitcoin network health: hash rate, difficulty, block pace, 24h transaction count, miner revenue and total coins mined.
* `address`  Bitcoin address summary: transaction count, total received/sent, balance and recent transactions.
* `address_balance`  Check the balance of up to 20 Bitcoin addresses at once, comma or space separated.
* `transaction`  Look up a Bitcoin transaction by hash: size, fee, inputs, outputs and the largest payments.
* `block_by_height`  Bitcoin block at a height: hash, mining time, size, weight, total fees and neighbouring blocks.
* `block_by_hash`  Bitcoin block by its 64-character hash, with the same size, fee and chain fields as block_by_height.
* `mempool`  Pending Bitcoin transactions: mempool depth plus fees and sizes of the newest waiting transactions.

## Usage

```bash
npm install
npm run build
node dist/index.js
```


