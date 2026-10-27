# Barcode MCP

Generate EAN-13 and Code-128 barcodes as real SVG images on the local machine. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `generate_ean`  EAN-13 barcode as SVG.
* `generate_code128`  Code-128 barcode as SVG.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Barcodes are rendered locally with the bwip-js engine and returned as SVG text.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
