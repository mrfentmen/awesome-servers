# football-data MCP

MCP server for football-data.org: soccer competitions, teams, matches. Free key.

Pairs well with `openligadb-soccer-mcp`, `thesportsdb-mcp`, and `theoddsapi-mcp`.

## Setup

Get a key at https://www.football-data.org/client/register/ (free, 10 calls/min), then:

```bash
export FOOTBALLDATA_API_KEY=your_key_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_competitions`: Competitions with ids.
- `team_matches`: Recent matches with scores (known: Arsenal 57, Barcelona 81).

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to football-data.org. Read-only.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
