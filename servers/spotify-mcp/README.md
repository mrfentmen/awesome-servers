# Spotify MCP

MCP server for Spotify: search albums, artists, tracks. Needs free API credentials.

## Setup

Create an app at https://developer.spotify.com/dashboard/ (free), then:

```bash
export SPOTIFY_CLIENT_ID=your_id
export SPOTIFY_CLIENT_SECRET=your_secret
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search`: Albums, artists, tracks.
- `get_album`: Date, tracks, label, link.
- `get_artist`: Followers, genres, link.

- `get_track`
- `artist_top`
- `artist_albums`
- `new_releases`
- `get_episode`
- `get_show`
- `browse_categories`
## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Credentials stay local and go only to Spotify's API. Catalog endpoints only (no user data).
