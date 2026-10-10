# censys-mcp

Query Censys Search (free tier; set CENSYS_API_ID + CENSYS_API_SECRET, HTTP Basic): host lookup by IP and host search with the Censys query language.

## Tools

- `get_host` — Censys record for an IP: services, ports and certificates.
- `search_hosts` — Search hosts with Censys query syntax, e.g. services.http.

## Source

[censys-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/censys-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `host_aggregate`
* `certificate_exposure`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-censys-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
