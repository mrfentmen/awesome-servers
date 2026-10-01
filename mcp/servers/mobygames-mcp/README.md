# mobygames-mcp

Query the MobyGames API (free key; set MOBYGAMES_API_KEY): game search across 300k+ titles incl. retro, and details.

## Tools

- `search_games` — Title search incl. retro (needs MOBYGAMES_API_KEY).
- `get_game` — One game by id, with platforms, genres and score.

## Source

[mobygames-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/mobygames-mcp)

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `steam_game_profile`
* `steam_specials_census`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
