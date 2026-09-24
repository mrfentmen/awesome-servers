# JetBrains MCP

Keyless MCP server for JetBrains Marketplace: plugin search, details, ratings, downloads.

Pairs well with `open-vsx-mcp`, `npm-search-mcp`, and `pypi-mcp`.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_plugins`: Names, descriptions, downloads, ratings.
- `get_plugin`: Vendor, rating, page link.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required.
