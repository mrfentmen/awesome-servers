# gamebanana mcp

The [GameBanana](https://gamebanana.com) mods database, millions of game
mods across Doom, Half Life, GTA, Minecraft and everything else. No key.

## Tools

- `search_mods`, search mods by name across all games
- `get_mod`, description, author, game, downloads, file size, download link
- `get_game_mods`, the latest mods for a game id
(find ids via `get_mod` on any of that game's mods, the mod page shows its game)

## Run

```bash
npm install && npm run build && node dist/index.js
```

## Example

> `search_mods("Brutal Doom")` → pick a mod id → `get_mod(<id>)`
> shows the game id → `get_game_mods(<gameId>)` for the full feed.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_mods`: Search GameBanana for mods across all games.
- `get_mod`: Get a GameBanana mod page: description, author, downloads, size, category.
- `search_games`: Search GameBanana for games by title.
- `get_game_mods`: List the latest mods for a game on GameBanana.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `search_mods`.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
