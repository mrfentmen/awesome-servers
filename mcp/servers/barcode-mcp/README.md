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

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `generate_qr_code`
* `validate_barcode`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-barcode-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
