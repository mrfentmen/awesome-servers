# PDF Generator MCP

Generate PDF documents on the local machine. No network, no key, no external service. Useful for invoices, reports, and certificates.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `create_pdf`  Create a PDF with a title and body.
* `create_report`  Create a report PDF with bullets.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Output files are written to the system temp directory and the path is returned. Files are created for real and can be opened with any PDF reader.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `url_to_pdf`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-pdf-generator-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
