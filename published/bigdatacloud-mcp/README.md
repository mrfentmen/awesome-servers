# Bigdatacloud MCP

BigDataCloud client IP and reverse geocode APIs. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `client_ip`  Get caller IP details.
* `reverse_geocode`  Reverse geocode coordinates to a location.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Bigdatacloud API.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
