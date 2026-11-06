# HAL MCP

Search HAL, the French national open archive of academic papers. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/hal-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "hal-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/hal-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search` | Search HAL papers by keyword |

## Notes

HAL indexes French academic output across every discipline. Results include the publication year and a landing-page link.

## Licence

MIT
