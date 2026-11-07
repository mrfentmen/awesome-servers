# data.gouv.fr MCP

Search French open data datasets on data.gouv.fr. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/data-gouv-fr-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "data-gouv-fr-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/data-gouv-fr-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_datasets` | Search French open datasets |

## Notes

Search accepts French or English terms. Datasets belong to organisations such as communes or ministries.

## Licence

MIT
