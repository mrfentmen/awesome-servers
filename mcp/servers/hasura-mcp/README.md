# Hasura MCP

MCP server for Hasura: metadata export, SQL passthrough. Works with any self-hosted instance.

## Setup

```bash
export HASURA_URL=http://localhost:8080
export HASURA_ADMIN_SECRET=secret
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `export_metadata`: Sources and tracked tables.
- `run_sql`: SELECT/WITH queries only (writes are refused by the tool).

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Credentials stay local and go only to your instance.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `metadata_census`
* `sql_audit`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-hasura-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
