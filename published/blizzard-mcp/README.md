# Blizzard MCP

MCP server for Blizzard games: WoW token price, achievements, Diablo seasons. Needs a free API client.

## Setup

Create a client at https://develop.battle.net/ (free), then:

```bash
export BLIZZARD_CLIENT_ID=your_id
export BLIZZARD_CLIENT_SECRET=your_secret
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `wow_token_price`: Gold price per region.
- `wow_achievements`: Sample achievements.
- `diablo_seasons`: Recent Diablo 3 seasons.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Credentials stay local and go only to Blizzard's API. All tools are read-only.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
