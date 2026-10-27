# Color MCP

Look up color names, conversions, and generated schemes from The Color API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `color_info`  Name and conversions for a color.
* `color_scheme`  A generated color scheme.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Color data comes from the public The Color API.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
