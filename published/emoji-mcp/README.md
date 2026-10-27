# Emoji MCP

Search emoji by name or keyword from a bundled catalog. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search`  Find emoji by keyword.
* `categories`  List categories.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

The emoji catalog is bundled with the server and searched locally.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
