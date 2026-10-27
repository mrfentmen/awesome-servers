# OpenAIRE

Search OpenAIRE for European research publications, datasets and funded projects - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/openaire-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "openaire-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/openaire-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_publications` | Find research publications by title keywords. |
| `search_datasets` | Find research datasets by keyword. |
| `search_projects` | Find funded research projects by keyword. |

## Data source

OpenAIRE Graph public search API
