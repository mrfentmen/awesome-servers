# data.gov.uk MCP

Search UK government open datasets on data.gov.uk. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/data-gov-uk-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "data-gov-uk-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/data-gov-uk-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_datasets` | Search UK government datasets |

## Notes

The portal runs on CKAN. Search matches titles, descriptions and tags; the dataset name opens at data.gov.uk/dataset/<name>.

## Licence

MIT
