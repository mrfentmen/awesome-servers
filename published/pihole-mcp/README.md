# Pi-hole MCP

MCP server for Pi-hole: status, stats, blocking toggle. Works with any instance (v6 API).

## Setup

Use your web password (or an app password from Settings > Web interface):

```bash
export PIHOLE_URL=http://localhost
export PIHOLE_PASSWORD=secret
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `status`: Blocking state plus 24h stats.
- `set_blocking`: Toggle with optional auto re-enable timer.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Credentials stay local and go only to your Pi-hole.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
