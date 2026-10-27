# Unit Converter MCP

Convert between units of length, weight, temperature, speed, and data size on the local machine. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `convert`  Convert a value.
* `list_units`  Units in a category.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Conversions use exact metric definitions and standard US customary equivalents.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
