# UK Postcodes MCP

Look up UK postcodes on postcodes.io — area, district, ward, constituency, coordinates and grid reference, plus reverse lookup from a latitude and longitude. Keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/postcodes-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "postcodes-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/postcodes-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `postcode` | One postcode: region, district, ward, constituency, lat/lon, grid |
| `reverse` | Nearest postcodes to a lat/lon, with distance |

## Example

```
SW1A 1AA
Westminster, London, England
Constituency: Cities of London and Westminster
Location: 51.50101, -0.141563
Grid: 529090E 179645N
```

## Notes

Reads the public postcodes.io API. No key, no login.

Spaces do not matter: `SW1A 1AA` and `sw1a1aa` are the same postcode.

Coordinates are bounded to the UK in the tool schema, so a typo fails fast
instead of returning an empty list.

`reverse` returns the distance in metres from the point you gave.

## Licence

MIT
