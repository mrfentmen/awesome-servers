# bridges-mcp

US bridge conditions: New York State bridge inspections and New York City bridge ratings - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/bridges-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "bridges-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/bridges-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `ny_bridges` | New York State bridges, optionally by county or poor condition |
| `ny_bridge_by_bin` | One New York bridge by BIN |
| `ny_bridge_summary` | Bridge counts and poor-bridge counts per county |
| `nyc_bridges` | New York City bridge ratings |
| `nyc_bridge_by_bin` | One New York City bridge by BIN |

## Data source

NY State DOT and NYC DOT
