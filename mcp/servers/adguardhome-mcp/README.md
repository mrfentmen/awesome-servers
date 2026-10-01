# adguardhome-mcp

Query your AdGuard Home (self-hosted; set ADGUARD_URL; optional ADGUARD_USER + ADGUARD_PASS basic auth): status, stats, query log. Endpoints per official docs.

## Tools

- `get_status` — DNS protection state: enabled, filters and upstreams.
- `get_stats` — Query and blocked-request counters, total and average.
- `get_query_log` — Recent DNS queries with client, domain and action.

## Source

[adguardhome-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/adguardhome-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `domain_coverage`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-adguardhome-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
