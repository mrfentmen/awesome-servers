# blubrry-mcp

Query Blubrry podcast hosting: list shows and media files, show download summaries, episode-level stats, and lifetime totals via the Blubrry API v2 (OAuth2 bearer token from Blubrry dashboard > Manage Account > Developers).

## Tools

- `list_shows` — List podcast shows on the Blubrry account.
- `list_show_media` — Unpublished and recently published media files for a show.
- `get_show_stats_summary` — Overall download summary for a show.
- `get_show_episode_stats` — Episode-level download counts for a show.
- `get_show_stats_totals` — Lifetime download totals for a show.

## Source

[blubrry-mcp](https://github.com/mrfentmen/awesome-mcps/tree/main/servers/blubrry-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `download_countries`
* `listening_apps`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-blubrry-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
