# NCBI Datasets

NCBI Datasets: genome assemblies for any taxon, gene records by symbol and taxonomy lookups - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/ncbi-datasets-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "ncbi-datasets-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/ncbi-datasets-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `genome_datasets` | Genome assembly reports for a taxon: accession, assembly name and level, sizes and dates. |
| `gene_datasets` | NCBI gene records for a symbol in a taxon: gene id, description, transcript and product counts. |
| `taxonomy` | Resolve a taxon name or id to its NCBI taxonomy record: tax id, organism name, rank and lineage ids. |

## Data source

NCBI Datasets v2 API (api.ncbi.nlm.nih.gov/datasets), no key required
