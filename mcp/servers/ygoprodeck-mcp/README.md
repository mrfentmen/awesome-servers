# Yu-Gi-Oh! Cards MCP

Yu-Gi-Oh! card text, stats and prices from YGOPRODeck. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/ygoprodeck-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "ygoprodeck-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/ygoprodeck-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `get_card` | Details for one Yu-Gi-Oh! card |

## Notes

Card names are case insensitive. The response includes the card type, attribute, level and full effect text.

## Licence

MIT
