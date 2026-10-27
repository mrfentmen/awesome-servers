# Carbon Intensity MCP

UK grid carbon intensity, forecast, and regional breakdown from the public Carbon Intensity API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `intensity`  Current intensity.
* `forecast`  Next 48 hours.
* `regional`  By region.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Carbon Intensity API for the UK electricity grid.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
