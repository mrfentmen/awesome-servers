# Enrico MCP

Enrico (kayaposoft) holiday API: public holidays by country and year. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `countries`  List supported countries.
* `holidays`  Public holidays for a country and year.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Enrico API.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
