# CricAPI MCP

MCP server for CricAPI: cricket matches, series, players. Free key.

## Setup

Get a key at https://cricapi.com/ (free), then:

```bash
export CRICAPI_API_KEY=your_key_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `current_matches`: Live and recent matches.
- `match_info`: Status, score, venue.
- `search_series`: Tournaments by name.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to CricAPI. Read-only.


