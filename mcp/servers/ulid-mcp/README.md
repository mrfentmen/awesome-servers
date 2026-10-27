# ULID

Generate, parse and sort ULIDs: lexicographically sortable unique IDs with embedded timestamps - fully local.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/ulid-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "ulid-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/ulid-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `generate_ulid` | Generate one or more ULIDs, optionally with a fixed timestamp. |
| `parse_ulid` | Decode a ULID into its timestamp and randomness parts. |
| `compare_ulids` | Compare two ULIDs and show chronological order. |

## Data source

Pure local computation, no network calls.
