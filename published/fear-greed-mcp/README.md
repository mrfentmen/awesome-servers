# Fear and Greed MCP

Read the crypto fear and greed index from the public alternative.me API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `current`  The current index value.
* `history`  Recent index values.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

The index is a sentiment measure from the public alternative.me API.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
