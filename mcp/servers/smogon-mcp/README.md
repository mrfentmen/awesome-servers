# Smogon

Use this MCP server to competitive Pokemon, full dex data plus monthly Smogon usage statistics.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_pokemon`: Search the full national dex by name (fuzzy). Returns types, base
- `get_pokemon`: Get one Pokemon by exact name.
- `get_usage_stats`: Monthly Smogon usage stats for a format, e.g. gen9ou (OverUsed),
- `list_months`: List the months with published Smogon usage statistics.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `search_pokemon`.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `pokemon_by_type`
* `pokemon_by_ability`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
