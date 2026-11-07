# UK Police Data MCP

Street level crime reports for England, Wales and Northern Ireland. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/uk-police-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "uk-police-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/uk-police-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `crimes_near` | Crimes reported near a coordinate |

## Notes

Dates use YYYY-MM. Data covers England, Wales and Northern Ireland, and is published with a two month delay.

## Licence

MIT
