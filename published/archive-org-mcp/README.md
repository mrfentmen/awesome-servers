# archive-org-mcp

Internet Archive search, item metadata, and Wayback snapshots.

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `searchItems` — Search the Internet Archive.
- `getItem` — Details and file manifest for an item.
- `getSnapshots` — Wayback snapshot history for a URL.
- `getAvailability` — Closest Wayback snapshot for a URL.
- `readSnapshot` — Read archived page text.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Source

Public free APIs only. See `src/api.ts` for exact endpoints.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
