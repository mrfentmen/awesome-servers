# gPodder MCP

Keyless MCP server for the gPodder podcast directory: search podcasts, top charts, tags, feeds and subscriber counts.

Pairs well with `radio-browser-mcp`, `tunein-mcp`, and `somafm-mcp`.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_podcasts`: Directory search with feeds and subscriber counts.
- `top_podcasts`: Chart by subscribers.
- `podcasts_by_tag`: Browse by tag.
- `list_tags`: Discover tags.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required.


