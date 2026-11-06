# SunriseSunset MCP

Sunrise, sunset, dawn, dusk and daylight length for any place and date. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/sunrisesunset-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "sunrisesunset-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/sunrisesunset-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `times` | Sun times for coordinates on a date |

## Notes

Times are local to the coordinates. Pass a date as YYYY-MM-DD, or leave it out for today.

## Licence

MIT
