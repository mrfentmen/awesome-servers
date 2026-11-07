# OpenF1 MCP

Formula 1 live timing data: drivers, sessions and lap times. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/openf1-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "openf1-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/openf1-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `session_drivers` | Drivers in the latest Formula 1 session |

## Notes

Session key latest follows the newest session. Drivers include their number, team and country.

## Licence

MIT
