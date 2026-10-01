# Dad Joke MCP

Keyless MCP server for icanhazdadjoke: random dad jokes, search, lookup by id.

Pairs well with `jokes-mcp`, `riddles-mcp`, and `quotes-mcp`.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `random_joke`: Fresh groans on demand.
- `search_jokes`: Jokes by keyword.
- `get_joke`: One joke by id.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `typed_joke`
* `chuck_fact`
* `comic_strip`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-dadjoke-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
