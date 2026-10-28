# OpenStreetMap Nominatim

Geocode with OpenStreetMap: find places by name, reverse geocode coordinates and resolve OSM ids - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/nominatim-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "nominatim-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/nominatim-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_places` | Find places by free-text name or address. |
| `reverse_geocode` | Turn coordinates into the address OpenStreetMap holds there. |
| `lookup_osm_ids` | Resolve OpenStreetMap element ids (N/W/R) to full details. |

## Data source

OpenStreetMap Nominatim. Public instance policy: at most 1 request per second, no heavy use
