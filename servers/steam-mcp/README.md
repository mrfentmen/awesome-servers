# steam mcp

Steam store search, prices and discounts, app details, and game news.
Uses Steam's keyless store + news endpoints.

## Tools

- `search_games`, Search the Steam store by title. Returns appids with current prices and discounts.
- `get_game_details`, Get details for a Steam app: price/discount, release date, developers, genres, Metacritic, description.
- `get_game_news`, Fetch recent Steam news posts for a game.
- `reviews`, Review totals for a game: total, positive and negative counts plus the summary label.
- `players`, How many players are in a game right now.
- `topsellers`, Current Steam top sellers with prices and discounts.
- `store_highlights`, What Steam is pushing today: everything on sale with its discount, this week's new releases and the coming-soon list, in one call.
- `sales_check`, Check up to 15 app ids for a current discount and report the biggest one - how a wishlist is reviewed before a sale ends.
- `player_count_rank`, Live concurrent player counts for up to 15 games, ranked, so a shortlist can be compared on what is actually being played now.

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

<!-- paywall -->
## Premium tools

These tools need a license key:

* `game_dlc_cost`
* `game_requirements`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-steam-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
