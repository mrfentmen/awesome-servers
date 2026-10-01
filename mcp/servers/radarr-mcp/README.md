# radarr-mcp

Query your Radarr instance (self-hosted; set RADARR_URL + RADARR_API_KEY, query param): movies, queue, health. Endpoints per official docs.

## Tools

- `list_movies` — Movies in the Radarr library, with status.
- `get_queue` — Active downloads and imports in the queue.
- `get_health` — Radarr health warnings and errors.

## Source

[radarr-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/radarr-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `film_facts`
* `filmography`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-radarr-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
