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

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `decode_cid`
* `compare_cids`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
