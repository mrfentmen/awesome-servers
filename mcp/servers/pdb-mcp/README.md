# RCSB Protein Data Bank MCP

RCSB PDB: search 230k+ structures, read chains, ligands, formulas and citations — keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y pdb-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "pdb-mcp": { "command": "npx", "args": ["-y", "pdb-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_structures` | Full-text search across the whole PDB |
| `structure_summary` | Title, method, resolution, authors |
| `structure_chains` | Polymer entities, chains and residue counts |
| `structure_ligands` | Bound ligands with component ids and weights |
| `ligand_info` | Chemical component formula and synonyms |
| `structure_citation` | The paper behind a structure, with DOI |

## Example

```
4HHB polymer chains (2):

1. entity 1 — Hemoglobin subunit alpha
   chain(s) A, C · 141 residues · polypeptide(L)
```

## Notes

Uses both RCSB services: search.rcsb.org for the query API and data.rcsb.org for records. Weights are normalised to Da and kDa for readability, and the RCSB site link is included for every structure.

## Licence

MIT
