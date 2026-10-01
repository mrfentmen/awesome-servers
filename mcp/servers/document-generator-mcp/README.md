# Document Generator MCP

Generate real Word documents on the local machine with headings, paragraphs, and tables. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `create_doc`  Create a Word document.
* `create_report`  Create a bulleted report.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Output files are written to the system temp directory and the path is returned. Files open in Word, Pages, and Google Docs.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `create_table_document`
* `create_markdown_document`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-document-generator-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
