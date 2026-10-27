# PRIDE Archive

Proteomics identifications database: search mass-spec projects and read their methods and metadata - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/pride-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "pride-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/pride-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_projects` | Search PRIDE proteomics projects by keyword. |
| `project_detail` | Read one PRIDE project, its methods and instruments. |

## Data source

EBI PRIDE Archive API
