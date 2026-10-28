# audius mcp

MCP server for **Audius**, the decentralized streaming platform where underground and independent artists live.

## Tools

| Tool | What it does |
|---|---|
| `trending_tracks` | Trending tracks, filterable by genre (use exact values like `Hip-Hop/Rap`, `Electronic`, `Dubstep`, `Trap`) |
| `search_tracks` | Search tracks by keyword |
| `search_artists` | Search artists by name/handle |
| `get_artist_tracks` | An artist's uploaded tracks |

## Usage

```bash
npm run build && node dist/index.js
```

Example:

```
trending_tracks { genre: "Hip-Hop/Rap", limit: 5 }
search_artists { query: "nettspend" }
```

Keyless (public discovery API, `app_name` sent per docs). Includes play counts, durations, genres, and Audius permalinks.
