# BoardGameGeek MCP

Keyless MCP server for BoardGameGeek: search board games, get details, ratings, players, categories, mechanics, and hotness.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_games`: Search BoardGameGeek for board games and expansions by title.
- `get_game`: Full details for one game (description, players, time, categories, mechanics, ratings, rank).
- `hot_games`: The current BGG Hotness chart.

- `get_user`
- `user_plays`
- `user_collection`
- `guild_info`
- `forum_threads`
- `thread_articles`
- `geeklist`
## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required. Note: BGG throttles aggressively and sometimes answers HTTP 202 while preparing results; the server retries automatically. BGG may refuse datacenter IPs (401/403) — from a home connection it works fine.
