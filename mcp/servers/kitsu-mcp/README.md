# Kitsu MCP

Anime and manga catalogue with ratings and episode counts. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/kitsu-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "kitsu-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/kitsu-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_anime` | Search anime by title |

## Notes

Kitsu is a community catalogue for anime and manga. Ratings are out of 100 on a 10-point scale (e.g. 78.5 means 7.85).

## Licence

MIT
