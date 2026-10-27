# Picsum MCP

Keyless MCP server for Picsum: placeholder photos, author info, deterministic image URL builder.

Pairs well with `placehold-mcp`, `placeholder-images-mcp`, and `ui-avatars-mcp`.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_photos`: Browse ids, authors, dimensions.
- `get_photo`: One photo's info.
- `photo_url`: Direct image URL at any size, grayscale, blur.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
