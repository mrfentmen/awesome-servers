# Image Tools MCP

Resize and inspect local images with the sharp engine. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `resize_image`  Resize a local image.
* `inspect_image`  Return image format and dimensions.

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

* `probe_url`
* `convert_url_image`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-image-tools-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
