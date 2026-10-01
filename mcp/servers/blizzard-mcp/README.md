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

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `stat_weights`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
