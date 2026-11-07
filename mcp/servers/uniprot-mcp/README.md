# UniProt MCP

Protein records from the UniProt knowledgebase, with sequences and organism names. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/uniprot-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "uniprot-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/uniprot-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_proteins` | Search UniProtKB protein records |
| `get_entry` | Full UniProt record by accession |

## Notes

UniProt's REST service needs no key. Search accepts the full UniProt query syntax, e.g. gene:BRCA1 or organism_id:9606.

## Licence

MIT
