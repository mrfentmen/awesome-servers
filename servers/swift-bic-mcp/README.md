# SWIFT BIC MCP

Look up SWIFT and BIC bank codes from a bundled directory. No network, no key, the query stays local.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search`  Search bank codes.
* `validate`  Check BIC format.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

The directory bundles common bank BICs for validation and search. Coverage is best effort and not exhaustive.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `analyse_bic`
* `country_directory`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-swift-bic-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
