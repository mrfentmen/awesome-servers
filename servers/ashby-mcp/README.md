# Ashby MCP

Keyless MCP server for Ashby job boards: openings, departments, locations.

Pairs well with `arbeitnow-mcp`, `remoteok-mcp`, and `jobicy-mcp`.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_jobs`: Open roles with departments and locations.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required.
