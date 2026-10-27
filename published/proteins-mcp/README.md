# EBI Proteins

UniProt protein records via the EBI Proteins API: sequences, names, organisms, features and taxon listings - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/proteins-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "proteins-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/proteins-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `protein_record` | Full protein record by UniProt accession. |
| `proteins_by_taxon` | Proteins recorded for a species by NCBI taxon ID. |
| `protein_features` | Annotated sequence features such as domains and active sites. |

## Data source

EBI Proteins API (UniProt)
