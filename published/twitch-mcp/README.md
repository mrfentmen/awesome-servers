# Twitch MCP

MCP server for Twitch: top games, live streams, users. Needs free API credentials.

## Setup

Create an app at https://dev.twitch.tv/console/ (free), then:

```bash
export TWITCH_CLIENT_ID=your_id
export TWITCH_CLIENT_SECRET=your_secret
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `top_games`: Most-watched categories.
- `top_streams`: Live streams, optionally per game.
- `get_user`: Id, name, type, bio.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Credentials stay local and go only to Twitch's API. All tools are read-only.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
