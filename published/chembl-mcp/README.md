# ChEMBL

ChEMBL bioactivity data: search molecules and targets, read properties and known activities - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/chembl-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "chembl-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/chembl-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_molecules` | Find ChEMBL molecules by name or synonym. |
| `molecule_detail` | Full ChEMBL record for one molecule: formula, weight, approval phase. |
| `search_targets` | Find ChEMBL drug targets by name or gene. |

## Data source

ChEMBL API (EBI)
