# Trakt MCP

MCP server for Trakt: shows, movies, trending. Needs a free API key.

Pairs well with `tvmaze-mcp`, `tmdb-mcp`, and `episodate-mcp`.

## Setup

Get a key at https://trakt.tv/oauth/applications/ (free), then:

```bash
export TRAKT_API_KEY=your_key_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_shows`: Shows with years and IMDb links.
- `trending_shows`: Trending now.
- `trending_movies`: Trending now.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to Trakt. Read-only.


