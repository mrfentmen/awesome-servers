# sqlite-mcp

Zero-dependency SQLite MCP server built on Node's built-in `node:sqlite` (no native bindings to compile). Run read queries, execute writes, list tables, describe schemas.

## Setup

Pass the database file as the first argument (created if missing) or set `SQLITE_DB_PATH`:

```bash
node dist/index.js /tmp/cli-dev.db
```

Requires Node >= 22.

## Tools

- `query` — Read-only SELECT/WITH queries with optional bound parameters.
- `execute` — Write statements (INSERT/UPDATE/DDL): reports rows changed + last insert id.
- `list_tables` — All tables and views with row counts.
- `describe_table` — Columns, types, defaults, primary keys, and indexes for one table.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).
