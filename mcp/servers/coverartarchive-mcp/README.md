# Cover Art Archive MCP

Album cover art from the Cover Art Archive by MusicBrainz release id. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/coverartarchive-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "coverartarchive-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/coverartarchive-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `release_artwork` | Cover images for a MusicBrainz release |

## Notes

Release ids are MusicBrainz UUIDs. Each image includes a front flag and thumbnail sizes.

## Licence

MIT
