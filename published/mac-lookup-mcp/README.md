# MAC Lookup MCP

Look up the vendor of a MAC address from the public MAC Vendors database. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `vendor_lookup`  Vendor for a MAC address.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Vendor data comes from the public MAC Vendors API.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
