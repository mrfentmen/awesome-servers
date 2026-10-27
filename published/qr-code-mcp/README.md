# QR Code MCP

Generate QR codes as real PNG images on the local machine. No network, no key, no external service.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `generate_qr`  Generate a QR code PNG.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Output files are written to the system temp directory and the path is returned.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
