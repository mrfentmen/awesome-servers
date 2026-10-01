# Milvus MCP

MCP server for Milvus: collections, stats, search. Works with any instance.

## Setup

```bash
export MILVUS_URL=http://localhost:19530
export MILVUS_TOKEN=token_if_needed
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_collections`: Vector collections.
- `describe_collection`: Fields, types, dimension, metric.
- `collection_stats`: Row count, index state.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Credentials stay local and go only to your instance.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `vector_footprint`
* `search_cost`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-milvus-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
