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
