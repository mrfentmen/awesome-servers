# Ocean Life (OBIS)

OBIS marine biodiversity: taxon records, accepted names, children, occurrence records and datasets from the global ocean biodiversity index - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/obis-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "obis-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/obis-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `taxon_info` | Look up a marine taxon by scientific name or OBIS taxon ID. |
| `taxon_children` | Immediate children of a taxon in the OBIS backbone. |
| `occurrences` | Occurrence records for a taxon, with dataset, depth and coordinates. |

## Data source

OBIS - Ocean Biodiversity Information System
