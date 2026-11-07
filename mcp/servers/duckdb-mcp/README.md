# duckdb-mcp

Query local CSV, Parquet and JSON files with DuckDB SQL. No API key, no account, no network.

DuckDB runs in-process. Your files never leave the machine.

## Install

```bash
git clone https://github.com/mrfentmen/awesome-servers.git
cd awesome-servers/mcp/servers/duckdb-mcp
npm install
npm run build
```

## Use with an MCP client

```json
{
  "mcpServers": {
    "duckdb": {
      "command": "node",
      "args": ["/absolute/path/to/duckdb-mcp/dist/index.js"],
      "env": {
        "DUCKDB_MCP_ALLOWED_DIRS": "/Users/you/data:/Users/you/Downloads"
      }
    }
  }
}
```

## Tools

| Tool | What it does |
| --- | --- |
| `query` | Run one read-only SQL statement over local files |
| `inspect_file` | Schema and first 5 rows of a CSV, TSV, Parquet or JSON file |
| `list_files` | Find data files under a directory |

### query

- `sql` — one `SELECT`, `WITH`, `DESCRIBE`, `SUMMARIZE` or `EXPLAIN` statement
- `limit` — max rows returned, 1 to 5000 (default 500)

Use DuckDB's file readers as tables:

```sql
SELECT country, sum(amount) AS total
FROM read_csv_auto('/Users/you/sales.csv')
GROUP BY country
ORDER BY total DESC
```

Readers: `read_csv_auto`, `read_parquet`, `read_json_auto`. You can join any number of files in
one query.

### inspect_file

- `path` — absolute path inside the allowed directories

Returns the detected format, file size, column names and types, and 5 sample rows.

### list_files

- `directory` — folder to scan
- `recursive` — walk up to 5 levels (default false)
- `limit` — max files, 1 to 500 (default 200)

Skips dotfiles and `node_modules`.

## Safety

- **Read-only.** Only one statement is allowed, and it must start with a read keyword. Writes,
  `ATTACH`, `COPY`, `PRAGMA`, `SET`, `INSTALL` and `LOAD` are rejected. Strings and comments are
  stripped before the check, so data cannot hide a keyword.
- **Path jail.** Every path must resolve inside the allowed directories. Symlinks are resolved
  first, so a link cannot escape. DuckDB itself is locked to the same directories, so SQL like
  `read_csv('/etc/passwd')` cannot slip past the tool-level check.
- **No network.** External access is disabled inside DuckDB, so `httpfs` and remote reads stay
  off. The server makes no network calls.

## Environment variables

| Variable | Default | Meaning |
| --- | --- | --- |
| `DUCKDB_MCP_ALLOWED_DIRS` | your home directory | Folders the server may read, separated by `:` (`;` on Windows) |

Set it to the smallest set of folders you need.

## Limits

- Results are capped at 5000 rows per call.
- SQL is capped at 20,000 characters.
- Very large files are scanned by DuckDB on each query; project columns to keep it fast.
- No persistent database file is created. Each server process has its own in-memory database.

## License

MIT.
