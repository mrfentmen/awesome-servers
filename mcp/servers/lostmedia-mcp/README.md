# Lost Media MCP

Keyless MCP server for the Lost Media Wiki: search lost TV, film, music and games, track found / partially-found status.

Pairs well with `archive-org-mcp`, `wayback-mcp`, and `hiddenpalace-mcp` for dead-media recovery research.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_lost_media`: Search lost episodes, films, music, games, pilots.
- `get_article`: Article summary with found / partially-found / lost status.
- `random_article`: Fall down the rabbit hole.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `recent_changes`
* `browse_categories`
* `category_articles`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
