# AlphaFold MCP

AlphaFold predicted protein structures from the EBI database. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/alphafold-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "alphafold-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/alphafold-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `get_prediction` | AlphaFold model for a UniProt accession |

## Notes

Predictions are keyed by UniProt accession. The response includes links to the PDB and mmCIF model files.

## Licence

MIT
