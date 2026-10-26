# adguardhome-mcp

Query your AdGuard Home (self-hosted; set ADGUARD_URL; optional ADGUARD_USER + ADGUARD_PASS basic auth): status, stats, query log. Endpoints per official docs.

## Tools

- `get_status` — DNS protection state: enabled, filters and upstreams.
- `get_stats` — Query and blocked-request counters, total and average.
- `get_query_log` — Recent DNS queries with client, domain and action.

## Source

[adguardhome-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/adguardhome-mcp)

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
