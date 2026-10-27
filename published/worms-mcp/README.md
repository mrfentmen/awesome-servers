# WoRMS

World Register of Marine Species: search names, read records, children and full classification - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/worms-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "worms-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/worms-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_species` | Find marine species by scientific name. |
| `species_record` | Read one WoRMS record by AphiaID. |
| `species_children` | Direct children of a taxon. |
| `species_classification` | Full taxonomic classification from kingdom to species. |

## Data source

WoRMS REST API
