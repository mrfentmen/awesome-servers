# Cleveland Museum of Art MCP

Cleveland Museum of Art open access: 60,000+ works, CC0 images, department and artist filtering — keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/cleveland-art-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "cleveland-art-mcp": { "command": "npx", "args": ["-y", "cleveland-art-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_artworks` | Search the whole collection |
| `artwork_detail` | Technique, accession number, CC0 image |
| `works_by_department` | Works in one exact department name |
| `works_by_artist` | Works attributed to one artist |
| `open_access_highlights` | A random slice of CC0 works with images |

## Example

```
1. The Red Kerchief — Claude Monet (French, 1840–1926)
   c. 1868–73 · Painting · Modern European Painting and Sculpture
   id 135382 · 1958.39
```

## Notes

There is no departments endpoint in the open access API, so the department tool takes the display name and passes it through the filtered artworks query. Images are CC0 and hotlinkable.

## Licence

MIT
