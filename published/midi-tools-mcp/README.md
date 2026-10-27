# MIDI Tools MCP

MIDI note math: convert between note numbers, names, and frequencies. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `note_name`  Name for a MIDI number.
* `note_frequency`  Frequency for a MIDI number.
* `note_from_name`  MIDI number for a note name.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

All math runs locally with equal temperament tuning.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
