# Chess

Use this MCP server to chess.com. Player profiles, ratings, game archives, leaderboards, and titled players.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `get_player`: Get a chess.com player profile.
- `get_player_stats`: Get a player
- `get_player_games`: Get a player
- `get_leaderboards`: Top players on chess.com by rating.
- `get_titled_players`: List players with a title like GM or IM.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `get_player`.
