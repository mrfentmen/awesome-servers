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

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `get_character_age`
* `check_normalization`
* `search_named_sequences`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
