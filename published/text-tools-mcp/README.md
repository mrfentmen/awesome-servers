# Text Tools MCP

Slugify, convert case, and encode text on the local machine. No network, no key, nothing leaves the machine.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `slugify`  Make a URL slug.
* `to_case`  Convert text case.
* `base64`  Encode or decode base64.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

All processing happens locally.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
