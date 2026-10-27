# CSV Toolkit

CSV work offline: column summary with detected types, rows as JSON, and simple filtering by column value - fully local.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/csv-tools-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "csv-tools-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/csv-tools-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `csv_summary` | Columns, row count and detected value types for a CSV text. |
| `csv_to_json` | Convert CSV rows into JSON objects keyed by column name. |
| `csv_filter` | Rows where one column contains a value. |

## Data source

CSV parsing (RFC 4180 quoting, delimiter detection) implemented locally
