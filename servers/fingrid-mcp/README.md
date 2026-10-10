# fingrid-mcp

Fingrid Finnish grid open data: datasets and records. Needs free key.

## Setup

```bash
export FINGRID_API_KEY=...
```

Key goes in the x-api-key header. Free from data.fingrid.fi (10k req/day).

## Tools

- `list_datasets` — Fingrid open datasets with ids for record queries.
- `get_records` — Records from a Fingrid dataset in a time window.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

<!-- paywall -->
## Premium tools

These tools need a license key:

* `best_cheap_window`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-fingrid-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
