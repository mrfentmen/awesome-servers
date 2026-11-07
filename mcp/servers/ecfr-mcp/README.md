# eCFR MCP

US Code of Federal Regulations titles and their latest amendments. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/ecfr-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "ecfr-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/ecfr-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `list_titles` | All eCFR titles with amendment dates |

## Notes

Titles are numbered 1 to 50. Each entry lists the latest amendment date and whether the title is reserved.

## Licence

MIT
