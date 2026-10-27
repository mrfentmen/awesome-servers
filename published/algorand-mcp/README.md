# Algorand MCP

Algorand chain status from the public Algorand indexer. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `status`  Current status.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Algorand indexer API.

## Tools

* `status`  Network status.
* `circulatingSupply`  Circulating supply.
* `block_detail`  Block details.
* `asset_detail`  Asset details.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
