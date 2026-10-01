# Wikiquote MCP

Search famous quotes from the public Wikiquote API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search_quotes`  Search quote pages.
* `page_quotes`  Quotes from a page.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Quotes come from the public Wikiquote API.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `random_quote_page`
* `page_languages`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-wikiquote-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
