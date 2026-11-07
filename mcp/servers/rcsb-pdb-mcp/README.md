# RCSB PDB MCP

Experimental 3D structures of proteins and nucleic acids from the Protein Data Bank. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/rcsb-pdb-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "rcsb-pdb-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/rcsb-pdb-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `get_structure` | Structure summary for a PDB id |

## Notes

RCSB serves one JSON record per PDB id. Ids are four characters, e.g. 4HHB for haemoglobin.

## Licence

MIT
