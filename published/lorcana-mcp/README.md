# Disney Lorcana Cards

Disney Lorcana TCG cards via Lorcast: search by name, read stats, text and prices, and list every set - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/lorcana-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "lorcana-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/lorcana-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_cards` | Search Lorcana cards by name, text, set or ink. |
| `card_detail` | One card by its Lorcast id, with full text, prices and legalities. |
| `list_sets` | Every Lorcana set with its code and release dates. |

## Data source

Lorcast API (community Disney Lorcana card database)
