# SQL Formatter

Format, minify and split SQL statements offline - strings, quotes and comments are respected, keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/sql-format-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "sql-format-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/sql-format-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `format_sql` | Lay out a SQL statement with clauses on their own lines, SELECT lists one item per line and subqueries indented. |
| `minify_sql` | Collapse a SQL statement onto one line without touching strings or comments. |
| `split_statements` | Split a SQL script into statements on top-level semicolons, keeping strings and comments intact. |

## Data source

Runs fully offline — all work happens inside the server with no API calls and no keys.
