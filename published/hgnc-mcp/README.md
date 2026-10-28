# HGNC Gene Names

HGNC gene nomenclature: search genes by symbol, alias or identifier and read the full approved record - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/hgnc-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "hgnc-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/hgnc-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_genes` | Search HGNC genes by symbol, alias, previous symbol, name or a stable identifier such as an Ensembl or Entrez id. |
| `gene_record` | The full approved HGNC record for one gene symbol: name, location, aliases, cross-references and dates. |
| `gene_xrefs` | Every cross-reference HGNC holds for a gene: Ensembl, Entrez, UniProt, RefSeq, CCDS, OMIM and more. |

## Data source

HGNC REST API (rest.genenames.org), no key required
