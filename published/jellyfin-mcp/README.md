# Jellyfin MCP

MCP server for Jellyfin: server info, users, libraries. Works with any self-hosted instance.

## Setup

```bash
export JELLYFIN_URL=http://localhost:8096
export JELLYFIN_API_KEY=your_key_here  # Dashboard > API Keys (only for users/libraries)
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `server_info`: Public name and version (no key).
- `list_users`: Users, admins, activity (needs key).
- `list_libraries`: Media libraries and types (needs key).

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Credentials stay local and go only to your server.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
