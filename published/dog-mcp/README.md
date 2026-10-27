# Dog MCP

Dogs in one place: breed list, random photos by breed, breed image sets, facts, and random media. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools

* `listBreeds`  List all dog breeds.
* `randomImage`  Random dog photo, optionally by breed.
* `breedImages`  Several random photos of a breed.
* `facts`  Random dog facts.
* `randomMedia`  Random dog photo or video.

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
