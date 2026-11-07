# endoflife.date MCP

Support and end of life dates for languages, frameworks and databases. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/endoflife-date-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "endoflife-date-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/endoflife-date-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `get_product` | Release cycles and end of life dates |

## Notes

Product names are lowercase, e.g. nodejs, python or ubuntu. Each cycle lists its release date, end of life date and latest patch.

## Licence

MIT
