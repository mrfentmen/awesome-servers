# GEO Datasets

NCBI GEO datasets from E-utilities: search transcriptomics and methylation studies, count hits, and read one dataset's details - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/geo-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "geo-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/geo-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_datasets` | Search GEO DataSets by keyword, organism or study type. |
| `count_datasets` | Count GEO DataSets matching a term, with the query translation NCBI used. |
| `dataset_detail` | Full record for one GEO DataSet by UID or accession. |

## Data source

NCBI Entrez E-utilities (GEO DataSets, db=gds)
