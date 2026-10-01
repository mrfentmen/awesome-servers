# flipside-mcp

Flipside Crypto SQL API: run onchain queries, poll status, fetch results, cancel runs.

## Setup

```bash
export FLIPSIDE_API_KEY=YOUR_KEY
```

## Tools

- `create_query` — Submit a Flipside SQL query run against curated blockchain tables. Returns a token; poll status then fetch results.
- `get_query_status` — Poll a Flipside query run: pending, running, finished or failed with row count.
- `get_query_results` — Fetch result rows for a finished Flipside query run, paged.
- `cancel_query` — Cancel a pending or running Flipside query.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `saved_queries`
* `run_saved_query`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-flipside-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
