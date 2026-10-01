# TVDB MCP

MCP server for TheTVDB: series search, details. Needs a free API key.

Pairs well with `tvmaze-mcp`, `tmdb-mcp`, and `trakt-mcp`.

## Setup

Get a key at https://thetvdb.com/dashboard/account/apikey/ (free), then:

```bash
export TVDB_API_KEY=your_key_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_series`: Titles, years, networks, statuses.
- `get_series`: Network, status, overview.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to TheTVDB. Read-only.
