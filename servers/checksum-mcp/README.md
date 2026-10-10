# Checksum MCP

Compute sha256, sha1, and md5 checksums for text and local files. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `hash_text`  Hash a string.
* `hash_file`  Hash a local file.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Hashing runs locally with the built in crypto module.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `verify_checksum`
* `directory_manifest`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-checksum-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
