# rollbar-mcp

Query the Rollbar API (free tier token; set ROLLBAR_ACCESS_TOKEN, query param): projects, project items, item details.

## Tools

- `list_projects` — Rollbar projects the token can read.
- `list_items` — Error items in one project, most recent first.
- `get_item` — One error item by id, with occurrences and stack.

## Source

[rollbar-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/rollbar-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `dependency_audit`
* `advisory_detail`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-rollbar-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
