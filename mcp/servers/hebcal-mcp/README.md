# Hebcal MCP

Jewish holidays, Torah readings and Hebrew calendar data from Hebcal. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/hebcal-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "hebcal-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/hebcal-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `holidays` | Jewish holidays for a month |

## Notes

Months are 1 to 12. Setting maj and min returns major and minor holidays; the response also lists Rosh Chodesh and parashat.

## Licence

MIT
