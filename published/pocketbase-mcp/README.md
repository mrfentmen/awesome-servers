# PocketBase MCP

MCP server for PocketBase: collections, records, health. Works with any self-hosted instance.

## Setup

```bash
export POCKETBASE_URL=http://127.0.0.1:8090
export POCKETBASE_EMAIL=you@example.com
export POCKETBASE_PASSWORD=secret
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `health`: Instance reachability (no auth).
- `list_collections`: Collections (superuser).
- `list_records`: Records with filter syntax.
- `create_record`: New record from a JSON object.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Credentials stay local and go only to your instance.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
