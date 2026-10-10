# k6-mcp

Query a running k6 (open source; set K6_URL, default http://localhost:6565): runtime status and metric list. Endpoints per k6 REST API docs.

## Tools

- `get_status` — k6 run state, VUs, iterations.
- `list_metrics` — Metric names a k6 run can report.

## Source

[k6-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/k6-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `request_waterfall`
* `load_sample`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-k6-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
