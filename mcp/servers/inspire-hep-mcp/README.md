# INSPIRE-HEP

INSPIRE-HEP particle physics literature: search papers, read records and find authors - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/inspire-hep-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "inspire-hep-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/inspire-hep-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_literature` | Search high-energy physics papers by title, author or topic. |
| `literature_record` | Read one paper record by INSPIRE ID or arXiv ID. |
| `search_authors` | Find INSPIRE author profiles. |

## Data source

INSPIRE-HEP API
