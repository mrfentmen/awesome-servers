# Metronome MCP

Tempo and timing math for musicians. Convert BPM to beat and bar durations. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `bpm_to_ms`  Beat and bar durations.
* `note_duration`  Note durations.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

All math runs locally.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
