# RetroAchievements MCP

MCP server for RetroAchievements: games, achievements, user progress. Free key.

Pairs well with `rom-mcp`, `hiddenpalace-mcp`, and `speedrun-mcp`.

## Quick start

Get a key at https://retroachievements.org/settings/ (API key section, free), then:

```bash
export RA_USERNAME=your_username
export RA_API_KEY=your_key_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `game_extended`: Game with achievement list (find ids via rom-mcp).
- `user_progress`: Points, rank, recently played.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Credentials stay local and go only to RetroAchievements. Read-only.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
