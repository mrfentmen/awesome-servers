# Star Wars MCP

Look up Star Wars people, planets, and starships from the public SWAPI mirror. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `people_info`  Person details by ID.
* `planet_info`  Planet details by ID.
* `search_people`  Search characters.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public SWAPI Tech mirror.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
