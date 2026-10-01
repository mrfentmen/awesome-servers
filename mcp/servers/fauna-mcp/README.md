# Fauna MCP

MCP server for Fauna: collections, FQL queries. Needs a database secret.

## Setup

```bash
export FAUNA_SECRET=your_secret_here
export FAUNA_URL=https://db.fauna.com  # default
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_collections`: Collection names.
- `run_query`: Any FQL v10 query (reads return data; writes run with your secret's permissions — prefer reads).

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your secret stays local and goes only to Fauna.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `fql_lint`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-fauna-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
