# EMDB Cryo-EM

EBI Electron Microscopy Data Bank: search cryo-EM maps and read entries with resolution, method and citations - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/emdb-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "emdb-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/emdb-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_entries` | Search EMDB cryo-EM entries by free text (title, authors, sample). |
| `entry_detail` | One EMDB entry: title, resolution, method, authors, deposition date and the primary citation. |
| `entry_pdbs` | The PDB cross-references attached to an EMDB entry, from the entry record. |

## Data source

EBI EMDB REST API (www.ebi.ac.uk/emdb/api), no key required
