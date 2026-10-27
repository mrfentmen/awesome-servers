# Diff MCP

Compare two texts and show line changes locally. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `diff_text`  Simple diff.
* `unified_diff`  Unified diff with context.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Diffing runs locally with the diff library.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
