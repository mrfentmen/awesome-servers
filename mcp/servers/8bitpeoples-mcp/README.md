# 8Bitpeoples

Use this MCP server to 8bitpeoples, the free chiptune record label, browse the full release catalog.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_releases`: Browse the 8bitpeoples catalog. Chiptune and chip-hop releases,
- `get_release`: Get details for one release: artist, description, price.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `list_releases`.


