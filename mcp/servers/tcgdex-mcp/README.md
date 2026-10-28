# TCGdex

Pokemon trading card data from TCGdex - search cards by name, full card details with attacks, and set browsing, keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/tcgdex-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "tcgdex-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/tcgdex-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_cards` | Search Pokemon cards by name across every set TCGdex indexes. |
| `card_detail` | Everything TCGdex holds for one card: set, rarity, hp, types, weaknesses, retreat, attacks and card text. |
| `set_cards` | List the cards in one set, oldest to newest in the set's own numbering. |
| `list_sets` | Browse the TCGdex set catalogue with card counts, newest sets first. |

## Data source

TCGdex open Pokemon card database (api.tcgdex.net), English data.
