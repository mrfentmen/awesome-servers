# doab-mcp

Keyless Directory of Open Access Books: search open monographs and chapters.

## Setup

No API key needed.

## Tools

- `search_books` — Search DOAB open access books by keyword with handles and dates.
- `get_item` — DOAB record by handle prefix and suffix, e.g. 20.500.12854 and 170275.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

<!-- paywall -->
## Premium tools

These tools need a license key:

* `browse_directory`
* `item_metadata`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-doab-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
