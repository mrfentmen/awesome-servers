# unicode-mcp

A practical Unicode reference for agents working with internationalization, text processing, emoji, fonts, and character bugs.

## Tools

- `get_character`: inspect official UnicodeData fields for a code point.
- `search_blocks`: search Unicode block names and ranges.
- `search_emoji`: search the official emoji test data by name or annotation.

The server reads official Unicode data files and caches them only for the current process. Unicode normalization, rendering, grapheme segmentation, and font support are separate concerns and are not inferred by this server.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `get_character`: Get official UnicodeData metadata for a code point such as U+1F600 or 0041.
- `search_blocks`: Search official Unicode block names and ranges.
- `search_emoji`: Search the official Unicode emoji test data by annotation or emoji name.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `get_character`.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
