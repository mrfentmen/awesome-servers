# kong-mcp

Query your Kong Admin API (self-hosted; set KONG_ADMIN_URL, default http://localhost:8001): status, services, routes. Endpoints per official docs.

## Tools

- `get_status` — Kong status counters: database and connections.
- `list_services` — Services configured in Kong, with hosts.
- `list_routes` — Routes configured in Kong, with paths.

## Source

[kong-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/kong-mcp)

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
