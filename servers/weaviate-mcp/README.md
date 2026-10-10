# Weaviate MCP

MCP server for Weaviate: collections, objects, GraphQL search. Works with any instance.

## Setup

```bash
export WEAVIATE_URL=http://localhost:8080
export WEAVIATE_API_KEY=key_if_needed
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_classes`: Collections with property names.
- `list_objects`: Objects with properties.
- `graphql_query`: Raw Get {} search (mutations refused by the tool).

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Credentials stay local and go only to your instance.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `schema_health`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-weaviate-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
