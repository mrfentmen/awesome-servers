# adguardhome-mcp

Query your AdGuard Home (self-hosted; set ADGUARD_URL; optional ADGUARD_USER + ADGUARD_PASS basic auth): status, stats, query log. Endpoints per official docs.

## Tools

- `get_status` — DNS protection state: enabled, filters and upstreams.
- `get_stats` — Query and blocked-request counters, total and average.
- `get_query_log` — Recent DNS queries with client, domain and action.

## Source

[adguardhome-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/adguardhome-mcp)
