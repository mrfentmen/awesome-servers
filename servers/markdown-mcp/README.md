# Markdown MCP

Convert markdown to HTML and extract heading outlines locally. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `to_html`  Markdown to HTML.
* `headings`  Heading outline.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Conversion runs locally with the marked library.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `table_to_markdown`
* `check_document`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-markdown-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
