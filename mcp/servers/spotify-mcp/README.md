# spotify-mcp

Query the Spotify Web API (free app; set SPOTIFY_CLIENT_ID + SPOTIFY_CLIENT_SECRET, client-credentials token auto-minted): search, artists, albums.

## Tools

- `search` — Search the Spotify catalog for tracks, artists or albums.
- `get_artist` — Artist profile: genres, popularity and follower count.
- `get_album` — Album details plus its track list and release date.

- `get_track` — Track details.
- `artist_top` — Top tracks (US).
- `artist_albums` — Album list.
- `new_releases` — Fresh albums.
- `get_episode` — Podcast episode.
- `get_show` — Podcast show.
- `browse_categories` — Browse genres.

## Source

[spotify-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/spotify-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `artist_identity`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-spotify-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
