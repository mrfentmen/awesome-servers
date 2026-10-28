# rail-infrastructure-mcp

US rail infrastructure: highway-rail grade crossings and railroad bridges by state, with inspection and traffic detail - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/rail-infrastructure-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "rail-infrastructure-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/rail-infrastructure-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `crossings_by_state` | Highway-rail grade crossings in a US state |
| `crossing_detail` | One highway-rail crossing by USDOT crossing id |
| `bridges_by_state` | Railroad bridges in a US state |
| `bridge_search` | Search railroad bridges by name, owner or waterway |
| `rail_summary` | Crossing and bridge counts for a state |

## Data source

USDOT BTS rail data
