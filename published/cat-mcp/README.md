# Cat MCP

Cats in one place: random facts, breed lists, breed details, and cat photos. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools

* `fact`  Random cat fact.
* `breeds`  List cat breeds.
* `breedInfo`  Detailed breed info by id.
* `photo`  Random cat photo, optionally by tag.
* `searchImages`  Several random cat photos.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
