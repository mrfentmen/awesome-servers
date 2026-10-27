# Link Shortener MCP

Shorten and expand URLs with the public is.gd service. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `shorten`  Shorten a URL.
* `expand`  Expand a short URL.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

The is.gd service is free and public. Very short URLs are created for real.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
