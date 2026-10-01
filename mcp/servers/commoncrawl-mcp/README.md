# commoncrawl-mcp

Discover historical web captures through the Common Crawl index. This server is for provenance research, archival discovery, broken-link investigations, and finding the capture metadata needed for a later archive fetch.

## Tools

- `list_indexes`: list recent crawl collections.
- `latest_index`: return the newest collection id.
- `search_captures`: search URL or wildcard patterns and return capture index metadata such as timestamp, status, digest, filename, offset, and length.

This server searches the index only. It does not download page contents, bypass access controls, or guarantee that a capture is complete or legally reusable. Requests and result pages are bounded.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_indexes`: List available Common Crawl web crawl index collections, newest first.
- `latest_index`: Return the identifier of the newest Common Crawl index collection.
- `search_captures`: Find historical Common Crawl captures matching a URL or wildcard pattern. This returns index metadata, not page contents.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `list_indexes`.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `capture_history`
* `index_stats`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
