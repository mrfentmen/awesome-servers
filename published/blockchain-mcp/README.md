# Blockchain MCP

Bitcoin blockchain data from Blockstream and mempool.space. Latest block height, block details, address stats, and fee estimates. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `latest_height`  Latest Bitcoin block height.
* `block_info`  Block details by height.
* `fee_estimates`  Recommended fee rates.
* `address_info`  Address statistics.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Blockstream and mempool.space APIs.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
