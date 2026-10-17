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


