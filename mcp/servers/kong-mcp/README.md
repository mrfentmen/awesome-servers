# kong-mcp

Query your Kong Admin API (self-hosted; set KONG_ADMIN_URL, default http://localhost:8001): status, services, routes. Endpoints per official docs.

## Tools

- `get_status` — Kong status counters: database and connections.
- `list_services` — Services configured in Kong, with hosts.
- `list_routes` — Routes configured in Kong, with paths.

## Source

[kong-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/kong-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `cors_preflight`
* `edge_headers`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-kong-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
