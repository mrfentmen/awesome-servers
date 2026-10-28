# OSRS Grand Exchange

Old School RuneScape Grand Exchange prices from the official wiki API - item search, live buy/sell prices and price history, keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/osrs-ge-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "osrs-ge-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/osrs-ge-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `item_search` | Search Old School RuneScape items by name, with current buy and sell prices. |
| `item_price` | Current Grand Exchange price for one item, by name or item id: instant buy/sell, spread, trade recency and 5-minute averages. |
| `price_history` | Historical Grand Exchange averages for one item at 5m, 1h, 6h or 24h granularity. |

## Data source

The OSRS Wiki real-time price API (prices.runescape.wiki). Behaviour follows the wiki's API etiquette: one shared user-agent and cached mapping/latest tables.
