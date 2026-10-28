# mygene.info

Gene annotations from mygene.info: search genes by symbol or keyword and read full records - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/mygene-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "mygene-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/mygene-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_genes` | Search genes by symbol, name or free text, optionally limited to a species. |
| `gene_record` | One gene record with summary, aliases, genomic position and RefSeq ids. |

## Data source

mygene.info (The Scripps Research Institute)
