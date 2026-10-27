# SWIFT BIC MCP

Look up SWIFT and BIC bank codes from a bundled directory. No network, no key, the query stays local.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search`  Search bank codes.
* `validate`  Check BIC format.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

The directory bundles common bank BICs for validation and search. Coverage is best effort and not exhaustive.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
