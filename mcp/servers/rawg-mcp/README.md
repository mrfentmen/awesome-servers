# rawg-mcp

Query the RAWG video games database (free key from rawg.io/apidocs; set RAWG_API_KEY): game search and details with ratings, platforms, genres.

## Tools

- `search_games` — Game search (needs RAWG_API_KEY).
- `get_game` — One game by id or slug, with platforms and rating.

## Source

[rawg-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/rawg-mcp)

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `steam_store_info`
* `steam_reach`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
