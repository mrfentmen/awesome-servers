# Number Tools MCP

Convert numbers between bases, make roman numerals, and spell out numbers locally. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `convert_base`  Convert between bases.
* `roman`  Convert to and from roman numerals.
* `spell_number`  Spell a number in words.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

All processing happens locally.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
