# Near-Earth Objects

NASA near-earth asteroids: who passes close on a date range, with size, speed and miss distance - NASA_API_KEY optional.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/nasa-neo-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "nasa-neo-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/nasa-neo-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `close_approaches` | Asteroids approaching Earth between two dates, nearest first. |
| `object_detail` | One asteroid by its NASA id: orbit class, size range and all close approaches. |

## Data source

NASA NeoWs (Near Earth Object Web Service); works with the shared DEMO_KEY unless NASA_API_KEY is set
