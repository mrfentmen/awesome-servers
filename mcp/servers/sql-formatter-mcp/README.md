# SQL Formatter MCP

Format SQL queries into readable layouts on the local machine. No network, no key, the query never leaves the machine.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `format`  Format a SQL query.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Formatting uses the open source sql-formatter library and supports common dialects.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `minify`
* `analyse`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-sql-formatter-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
