# UUID MCP

Generate and validate UUIDs locally. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `generate_uuid`  One random UUID.
* `generate_many`  Several UUIDs.
* `validate_uuid`  Validate a UUID string.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Generation uses the crypto random source.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `uuid_info`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-uuid-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
