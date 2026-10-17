# SurrealDB MCP

MCP server for SurrealDB: version check, SQL queries. Works with any instance.

## Setup

```bash
export SURREALDB_URL=http://127.0.0.1:8000
export SURREALDB_USER=root
export SURREALDB_PASS=root
export SURREALDB_NS=test
export SURREALDB_DB=test
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `server_version`: Version string (no auth).
- `run_query`: Read-only SurrealQL (writes refused by the tool).

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Credentials stay local and go only to your instance.


