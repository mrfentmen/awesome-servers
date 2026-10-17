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


