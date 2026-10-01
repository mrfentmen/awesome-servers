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

These tools need a licence key:

* `domain_coverage`
* `filter_catalog`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
