# steam mcp

Steam store search, prices and discounts, app details, and game news.
Uses Steam's keyless store + news endpoints.

## Tools

- `search_games`, store search with current prices / discount percentages
- `get_game_details`, price, release date, developers, genres, Metacritic, blurb
- `get_game_news`, recent Steam news posts for a game

## Run

```bash
npm install && npm run build && node dist/index.js
```

## Example

> "What's Helldivers 2 cost and is it on sale?"
> `search_games("helldivers")` → `get_game_details(553850)`

> "What's new for Cyberpunk?"
> `get_game_news(1091500)`

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_games`: Search the Steam store by title. Returns appids with current prices
- `get_game_details`: Get details for a Steam app: price/discount, release date,
- `get_game_news`: Fetch recent Steam news posts for a game.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `search_games`.
