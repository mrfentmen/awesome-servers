# Art Institute of Chicago MCP

Artworks from the Art Institute of Chicago public collection API. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/art-institute-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "art-institute-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/art-institute-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_artworks` | Search artworks in the collection |

## Notes

The collection API is keyless and covers more than 130,000 artworks. Search matches titles, artists and subjects.

## Licence

MIT
