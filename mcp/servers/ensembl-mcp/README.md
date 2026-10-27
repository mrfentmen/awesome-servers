# Ensembl

Ensembl genomes: look up genes and transcripts by symbol, fetch sequences and list xrefs - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/ensembl-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "ensembl-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/ensembl-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `lookup_gene` | Resolve a gene symbol to its Ensembl gene, with position and biotype. |
| `gene_sequence` | The genomic sequence of an Ensembl gene, as FASTA-ish text. |
| `gene_xrefs` | Cross-references for a gene: RefSeq, UniProt, GO and others. |

## Data source

Ensembl REST API (EBI)
