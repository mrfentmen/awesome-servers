# netdata-mcp

Query your Netdata agent (self-hosted; set NETDATA_URL; optional NETDATA_TOKEN): node info, chart list, chart data. Endpoints per official docs.

## Tools

- `get_info` — Agent version, OS, collectors.
- `list_charts` — Charts exposed by the Netdata agent.
- `get_data` — Recent data points for a chart.

## Source

[netdata-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/netdata-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `netdata_release_census`
* `netdata_platform_audit`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-netdata-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
