# Cover Art Archive MCP

Keyless MCP server for the Cover Art Archive: album and single artwork by MusicBrainz ID, front/back covers and thumbnails.

Pairs well with `musicbrainz-mcp` (find the MBID), `audius-mcp`, and `vgmdb-mcp`.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `get_cover`: Archived artwork for a release or release-group MBID.
- `front_url`: Direct front-cover image URL builder (no fetch).

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required.


