# JSON Tools MCP

Validate, format, and inspect JSON on the local machine. No network, no key, nothing is sent anywhere.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `validate_json`  Check JSON validity.
* `format_json`  Pretty print JSON.
* `json_info`  Return top level type and key count.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

All processing happens locally. The server never sends your JSON anywhere.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
