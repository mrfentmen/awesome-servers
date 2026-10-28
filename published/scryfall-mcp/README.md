# Scryfall (Magic cards)

Magic: The Gathering cards from Scryfall: full-text search, exact lookups, prices and legalities - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/scryfall-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "scryfall-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/scryfall-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_cards` | Search cards with Scryfall syntax, e.g. 'o:draw t:instant cmc<=2'. |
| `card_by_name` | One card by (fuzzy) name, with mana cost, prices and formats. |

## Data source

Scryfall API
