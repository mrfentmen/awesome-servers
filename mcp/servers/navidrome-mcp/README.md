# Navidrome MCP

MCP server for Navidrome: artists, albums, search, streams. Works with any instance.

## Setup

```bash
export NAVIDROME_URL=http://localhost:4533
export NAVIDROME_USER=you
export NAVIDROME_PASSWORD=secret
npm install
npm run build
node dist/index.js
```

Passwords are hashed into Subsonic tokens client-side and never sent in clear. The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `ping`: Server answers.
- `list_artists`: Artists in the library.
- `search_library`: Artists and albums by name.
- `stream_url`: Authenticated stream URL builder (no fetch).

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Everything stays on your network.
