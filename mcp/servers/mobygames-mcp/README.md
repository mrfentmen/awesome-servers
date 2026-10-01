# mobygames-mcp

Query the MobyGames API (free key; set MOBYGAMES_API_KEY): game search across 300k+ titles incl. retro, and details.

## Tools

- `search_games` — Title search incl. retro (needs MOBYGAMES_API_KEY).
- `get_game` — One game by id, with platforms, genres and score.

## Source

[mobygames-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/mobygames-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `steam_game_profile`
* `steam_specials_census`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-mobygames-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
