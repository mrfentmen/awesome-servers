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
