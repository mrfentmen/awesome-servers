# NCBI Gene

NCBI Gene records: search by symbol, disease or chromosome and read names, location, aliases and summaries - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/ncbi-gene-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "ncbi-gene-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/ncbi-gene-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_gene_records` | Search NCBI Gene by symbol, description or condition, in a chosen organism. |
| `gene_record` | Full gene record: official name, location, aliases and the GeneRIF-style summary. |

## Data source

NCBI Entrez E-utilities (Gene, db=gene)
