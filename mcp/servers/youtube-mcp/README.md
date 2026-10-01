# youtube-mcp

Query the YouTube Data API v3 (free Google key; set YOUTUBE_API_KEY, query param): video search, video details, channel details.

## Tools

- `search` — Videos matching a query, with title, channel and views.
- `video_details` — Title, description, view and like counts for a video.
- `channel_details` — Subscriber and video counts for a channel.

- `playlist_items` — Videos in a playlist.
- `channel_playlists` — Playlists of a channel.
- `most_popular` — Trending videos by region.
- `video_comments` — Top comments.
- `channel_videos` — Latest uploads.
- `search_channels` — Channels by query.
- `live_streams` — Live streams by query.

## Source

[youtube-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/youtube-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `channel_feed`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-youtube-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
