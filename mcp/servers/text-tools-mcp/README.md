# Text Tools MCP

Slugify, convert case, and encode text on the local machine. No network, no key, nothing leaves the machine.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `slugify`  Make a URL slug.
* `to_case`  Convert text case.
* `base64`  Encode or decode base64.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

All processing happens locally.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `text_metrics`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-text-tools-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
