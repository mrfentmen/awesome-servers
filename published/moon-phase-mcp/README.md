# Moon Phase MCP

Moon phase, illumination, and lunar age calculated locally from the calendar. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `moon_phase`  Current moon phase.
* `moon_on_date`  Moon phase for a date.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Phases are computed locally with a standard astronomical algorithm.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
