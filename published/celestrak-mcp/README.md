# CelesTrak MCP

Fetch satellite TLE orbital elements and catalog data from the public CelesTrak API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `group`  Satellites in a group.
* `satellite`  One satellite by number.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public CelesTrak API. TLE lines are standard two line elements used across the space industry.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
