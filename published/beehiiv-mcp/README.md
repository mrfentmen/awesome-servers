# beehiiv MCP

MCP server for beehiiv: publications, posts, subscribers. Needs an API key.

## Setup

Get a key at Publication Settings > API, then:

```bash
export BEEHIIV_API_KEY=your_key_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_posts`: beehiiv publication posts with statuses and links.
- `find_subscriber`: Find a beehiiv subscriber by email: status, tier, join date.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to beehiiv's API. All tools are read-only.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
