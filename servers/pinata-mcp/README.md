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

- `list_pins`: CIDs, names, sizes, dates.
- `pin_json`: Pin a JSON document (returns CID + gateway link).
- `unpin`: Remove a pin (cannot be undone).

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to Pinata's API.
