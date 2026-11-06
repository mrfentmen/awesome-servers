# Photon MCP

Geocoding on OpenStreetMap data — name, street, city, region, country and coordinates. Keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/photon-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "photon-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/photon-mcp"] }
  }
}
```

## Tool

| Tool | What it does |
|---|---|
| `geocode` | Places matching a name or address, with their coordinates |

## Example

```
"Paris" — 2 places

1. Paris — city
   Île-de-France, France
   at 48.85350, 2.34839
2. Paris — house
   ...
```

## Notes

Reads the public Photon service run by Komoot. No key, no login.

It is built for type-ahead, so it is fast and forgiving. It is not a routing
engine and it does not do reverse geocoding.

`lang` changes the language of names where OSM has translations.

The service asks heavy users to self-host. A few lookups per conversation are
fine; bulk geocoding of thousands of addresses is not.

## Licence

MIT
