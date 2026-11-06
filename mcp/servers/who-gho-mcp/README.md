# WHO GHO MCP

Search World Health Organization indicators from the Global Health Observatory. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/who-gho-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "who-gho-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/who-gho-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `indicators` | Search WHO health indicators by name |

## Notes

The Global Health Observatory holds thousands of indicators. Use the returned indicator code with the WHO GHO API to pull the actual data series.

## Licence

MIT
