# AlAdhan MCP

Daily Islamic prayer times for any city from the AlAdhan API. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/aladhan-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "aladhan-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/aladhan-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `prayer_times` | Prayer times for a city today |

## Notes

Times follow the calculation method (2 is ISNA, 3 is Muslim World League). Use a country name or code.

## Licence

MIT
