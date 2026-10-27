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

<!-- paywall -->
## Premium tools

These tools need a license key:

* `qr_capacity`
* `qr_size_report`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-qr-code-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
