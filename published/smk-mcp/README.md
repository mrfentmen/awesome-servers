# SMK National Gallery of Denmark

SMK open collection: search 200k+ artworks by keyword or artist and read object details with images - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/smk-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "smk-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/smk-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_art` | Search the SMK collection by keyword and list matching artworks with dates and artists. |
| `search_by_artist` | Find artworks by an artist name, filtered from a keyword search. |
| `artwork_detail` | One artwork in full: title, artist(s), production date, techniques, dimensions and image links. |

## Data source

SMK (Statens Museum for Kunst) open API (api.smk.dk), no key required
