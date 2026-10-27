# Eurostat

Eurostat statistics: pull any dataset by code with dimension filters, and inspect the dimensions a dataset exposes - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/eurostat-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "eurostat-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/eurostat-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `dataset_values` | Values from a Eurostat dataset, filtered by dimension codes. |
| `dataset_dimensions` | The dimensions a dataset exposes and the category codes seen in its latest slice. |

## Data source

Eurostat dissemination API (JSON-stat 2.0)
