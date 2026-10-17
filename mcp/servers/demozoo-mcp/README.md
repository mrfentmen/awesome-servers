# Demozoo MCP

Keyless MCP server for Demozoo, the demoscene database: search 390k+ demos, intros, graphics and music, get download links, credits, groups and sceners.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_productions`: Search demos, intros, graphics, music by text query.
- `get_production`: Full detail for one production (credits, download links, platforms).
- `get_releaser`: Group or scener profile (nicks, memberships, members).

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required.


