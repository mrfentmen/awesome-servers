# Awk MCP

AWK is a missing language in the MCP ecosystem. This server gives agents real text-processing tools instead of a stub.

Keyless. No API key. No signup. Requires the built-in `awk` command.

## Install

```bash
npx -y @mrfentmen/awk-mcp
```

Or in an MCP client:

```json
{
  "mcpServers": {
    "awk-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/awk-mcp"]
    }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `run_program` | Run an inline AWK program. |
| `run_script_file` | Run an AWK program from a file. |
| `check_program` | Parse an AWK program and report syntax errors. |
| `extract_columns` | Print selected columns. |
| `filter_rows` | Keep rows where an AWK condition is true. |
| `sum_column` | Sum one numeric column. |
| `average_column` | Average one numeric column. |
| `unique_column` | Print distinct values in first-seen order. |
| `sort_by_column` | Sort lines by one column. |
| `join_files` | Join two files on key columns. |
| `count_rows` | Count input rows. |
| `print_version` | Show the local AWK version. |

| `run_with_variables` | Run an AWK program with named variables. |
| `match_rows` | Keep rows matching an AWK regex. |
| `replace_text` | Replace regex matches with literal text. |
| `group_count` | Count rows per column value. |
| `column_stats` | Report count, sum, min, max and mean. |
| `distinct_count` | Count distinct values in a column. |
| `number_lines` | Prefix lines with line numbers. |
| `dedupe_lines` | Remove duplicate whole lines. |

## Safety

This server executes the local `awk` command. Treat programs as trusted input.

## Run locally

```bash
npm install
npm run build
node dist/index.js
```
