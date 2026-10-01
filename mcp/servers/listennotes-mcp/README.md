# listennotes-mcp

Query Listen Notes (free key; set LISTENNOTES_API_KEY, X-ListenAPI-Key): podcast search, best lists, episode details.

## Tools

- `search` — Podcast episodes matching a query, with podcast and date.
- `best_podcasts` — Curated best-podcast lists, e.g. tech.
- `get_episode` — One episode by id, with audio URL and description.

- `just_listen` — Serendipity listen.
- `get_podcast` — Show details.
- `podcast_recommendations` — Recommended podcasts.
- `list_genres` — Genre list.
- `trending_searches` — Trending queries.

## Source

[listennotes-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/listennotes-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `apple_podcast_search`
* `podcast_feed_cadence`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-listennotes-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
