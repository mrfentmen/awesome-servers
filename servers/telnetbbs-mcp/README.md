# Telnetbbs

Use this MCP server to Telnet BBS Guide, the directory of live retro BBSes you can still dial into.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_bbses`: List live retro BBSes you can dial into right now. Optionally filter
- `get_bbs`: Get the full listing for a specific BBS by name.
- `random_bbs`: Pick a random live BBS to explore, for the true dial up experience.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `list_bbses`.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `software_census`
* `bbs_stats`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-telnetbbs-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
