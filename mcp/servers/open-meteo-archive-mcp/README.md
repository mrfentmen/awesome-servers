# Open-Meteo Archive MCP

Historical daily weather from the Open-Meteo archive, back to 1940. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/open-meteo-archive-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "open-meteo-archive-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/open-meteo-archive-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `archive_weather` | Daily weather history for a place and date range |

## Notes

Dates use YYYY-MM-DD. The archive covers 1940 to about five days ago; use the forecast API for today.

## Licence

MIT
