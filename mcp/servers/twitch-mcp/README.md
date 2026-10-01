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

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `game_demand`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
