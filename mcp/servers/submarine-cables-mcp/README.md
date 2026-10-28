# submarine-cables-mcp

Submarine communications cables: list, search, landing points and route geometry from TeleGeography - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/submarine-cables-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "submarine-cables-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/submarine-cables-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `list_cables` | List submarine cables |
| `search_cables` | Search submarine cables by name |
| `cable_detail` | One submarine cable with length, owners and landing point count |
| `cable_landing_points` | Landing points for one cable |
| `cable_route` | Route geometry summary for a cable |

## Data source

TeleGeography Submarine Cable Map
