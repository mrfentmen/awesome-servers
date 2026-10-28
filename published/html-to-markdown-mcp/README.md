# HTML to Markdown MCP

Convert HTML into clean markdown locally. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `convert`  HTML to markdown.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Conversion runs locally with the turndown library.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `convert_url`
* `extract_links`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-html-to-markdown-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
