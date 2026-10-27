# NCBI Taxonomy

Look up NCBI taxonomy records, scientific names and full lineage by name or taxon ID - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/ncbi-taxonomy-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "ncbi-taxonomy-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/ncbi-taxonomy-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_taxonomy` | Find taxa by scientific or common name. |
| `get_taxon` | Read one taxon record by NCBI taxon ID. |
| `taxonomy_lineage` | Full taxonomic lineage for a taxon ID. |

## Data source

NCBI Entrez E-utilities
