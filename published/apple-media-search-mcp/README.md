# iTunes Search MCP

iTunes Search API: music, albums, tracks, podcasts, apps and ebooks — all keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/itunes-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "apple-media-search-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/itunes-mcp"]
    }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_itunes` | Search songs, albums, music videos or artists |
| `artist_albums` | Every album by an artist id |
| `album_tracks` | Track list with running times |
| `search_podcasts` | Podcasts with feed URLs |
| `search_apps` | iOS/macOS apps with ratings and prices |
| `search_books` | Apple Books catalogue |

## Example

```
iTunes album results for "daft punk" (3 of 3):

1. Random Access Memories — Daft Punk
   14 tracks · 2013-05-17 · Pop · $11.99
```

## Notes

The public iTunes endpoint answers with `text/javascript` and leading blank lines, so this server reads the body as text and parses it by hand. Prices come back in whole currency units.

## Licence

MIT
