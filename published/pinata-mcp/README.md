# Pinata MCP

MCP server for Pinata IPFS: pinned files, pin JSON, unpin. Needs a free API key.

## Setup

Create a key at https://app.pinata.cloud/keys/ (free), then:

```bash
export PINATA_JWT=your_jwt_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_pins`: Pinned IPFS files: CIDs, names, sizes, dates.
- `pin_json`: Pin a JSON document to IPFS. Returns the CID and gateway link.
- `unpin`: Remove a pin by CID. Cannot be undone.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to Pinata's API.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
