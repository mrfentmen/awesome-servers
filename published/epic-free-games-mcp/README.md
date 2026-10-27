# Epic Free Games MCP

Check which games are currently free on the Epic Games Store. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `free_games`  Currently free games.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Epic Games Store promotions endpoint.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
