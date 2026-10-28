# gbfs-mcp

Live bike-share station availability for New York, Chicago, San Francisco, Boston and Montreal - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/gbfs-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "gbfs-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/gbfs-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `systems` | List supported bike-share cities |
| `station_status` | Live bike and dock availability per station |
| `station_info` | Station locations and capacity |
| `free_bikes` | Free-floating bikes not docked at a station |
| `system_info` | System metadata for a bike-share city |

## Data source

GBFS bike-share feeds
