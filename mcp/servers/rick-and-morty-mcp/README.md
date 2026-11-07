# Rick and Morty MCP

Characters, locations and episodes from the Rick and Morty API. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/rick-and-morty-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "rick-and-morty-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/rick-and-morty-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_characters` | Search Rick and Morty characters |

## Notes

Search accepts partial names. Characters include status, species, gender and origin.

## Licence

MIT
