# TimeAPI MCP

Current time and date in any IANA timezone. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/timeapi-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "timeapi-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/timeapi-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `current_time` | Current time in a timezone |

## Notes

Timezones use IANA names such as Europe/London or America/New_York. The response includes the day of week and DST flag.

## Licence

MIT
