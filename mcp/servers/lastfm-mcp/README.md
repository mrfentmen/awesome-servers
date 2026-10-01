# lastfm-mcp

Query the Last.fm API (free key; set LASTFM_API_KEY, query param): top artists, top tracks, artist info.

## Tools

- `top_artists` — Artists with the most listeners worldwide.
- `top_tracks` — Tracks with the most listeners worldwide.
- `artist_info` — Bio, stats and similar artists.

## Source

[lastfm-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/lastfm-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `musicbrainz_artist`
* `artist_discography`
* `cover_art`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-lastfm-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
