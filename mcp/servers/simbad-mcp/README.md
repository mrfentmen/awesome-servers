# SIMBAD MCP

Keyless MCP server for SIMBAD: astronomical objects via TAP queries.

Pairs well with `celestrak-mcp`, `exoplanets-mcp`, and `jpl-sbdb-mcp`.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `lookup_object`: Object by name (id, type, coordinates).
- `cone_search`: Objects in an RA/Dec region.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required.


