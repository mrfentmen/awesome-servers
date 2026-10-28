# amtrak-mcp

Amtrak realtime: every train on the map with delay, speed and next stop, plus route and station reference data.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/amtrak-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "amtrak-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/amtrak-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `live_trains` | Every Amtrak train currently running |
| `train_status` | Live status for one train number or train id |
| `route_trains` | Live trains on one route |
| `stations` | Amtrak stations, optionally filtered by state |
| `station` | One Amtrak station by code |

## Data source

Amtraker
