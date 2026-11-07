# NWS Weather MCP

Seven day forecasts for US locations from the National Weather Service. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/nws-weather-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "nws-weather-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/nws-weather-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `forecast` | Daily forecast for a latitude and longitude |

## Notes

The National Weather Service covers the United States and its territories. Coordinates are decimal degrees; the first call resolves the local forecast office.

## Licence

MIT
