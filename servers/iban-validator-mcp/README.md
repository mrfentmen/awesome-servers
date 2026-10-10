# IBAN Validator MCP

Validate and format IBAN bank account numbers on the local machine. No network, no key, nothing is sent anywhere.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `validate`  Check IBAN validity.
* `info`  IBAN country and structure.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Validation follows the official IBAN checksum and format rules. The number is processed entirely locally.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `bban_structure`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-iban-validator-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
