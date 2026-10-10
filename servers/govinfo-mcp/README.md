# GovInfo MCP

MCP server for GovInfo: bills, laws, Federal Register, congressional records.

Pairs well with `congress-gov-mcp`, `federal-register-mcp`, and `courtlistener-mcp`.

## Quick start

Get a key at https://api.govinfo.gov/ (free), then:

```bash
export GOVINFO_API_KEY=your_key_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_collections`: Bills, laws, Register, Record, more.
- `search_published`: Keyword search across published documents.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to GovInfo. Read-only.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `federal_register_search`
* `federal_register_document`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-govinfo-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
