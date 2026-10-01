# Office Quotes MCP

Quotes from The Office TV show. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools

* `randomQuote`  Random The Office quote.
* `quoteById`  Quote by id.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

<!-- paywall -->
## Premium tools

These tools need a license key:

* `showInfo`
* `episodeList`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-office-quotes-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
