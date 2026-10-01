# Phone Validator MCP

Validate and format international phone numbers on the local machine with the libphonenumber library. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `validate`  Validate a phone number.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Formatting follows the international E.164 standard. The number is processed entirely locally.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `zone_time`
* `country_context`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-phone-validator-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
