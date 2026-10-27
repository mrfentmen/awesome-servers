# OpenDota MCP

Dota 2 heroes, match details, and player stats from the public OpenDota API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `heroes`  List heroes.
* `hero_stats`  Hero win rates.
* `match`  Details for one match.
* `player`  Summary for one player.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public OpenDota API.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
