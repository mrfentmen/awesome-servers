# rawg-mcp

Query the RAWG video games database (free key from rawg.io/apidocs; set RAWG_API_KEY): game search and details with ratings, platforms, genres.

## Tools

- `search_games` — Game search (needs RAWG_API_KEY).
- `get_game` — One game by id or slug, with platforms and rating.

## Source

[rawg-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/rawg-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `steam_store_info`
* `steam_reach`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-rawg-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
