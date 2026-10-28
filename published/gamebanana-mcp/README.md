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
