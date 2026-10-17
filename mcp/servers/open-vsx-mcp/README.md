# Open VSX MCP

Keyless MCP server for Open VSX: VS Code extensions, versions, descriptions, download stats.

Pairs well with `npm-search-mcp`, `pypi-mcp`, and `hex-mcp` for the full package-manager set.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_extensions`: Descriptions, download counts.
- `get_extension`: Version, license, links, recent versions.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required.


