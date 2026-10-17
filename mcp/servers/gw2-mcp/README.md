# Gw2

Use this MCP server to Guild Wars 2, items, trading post prices, achievements, and living world data.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_items`: Search Guild Wars 2 items by name.
- `get_item`: Get a GW2 item by id.
- `get_item_price`: Trading Post buy and sell prices for an item.
- `get_achievement`: Get a GW2 achievement by id.
- `get_daily_achievements`: Today

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `search_items`.


