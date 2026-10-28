# DailyMed

DailyMed drug labels from the FDA: find labels by drug name and read one label's sections - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/dailymed-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "dailymed-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/dailymed-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_labels` | Find drug labels by drug name. |
| `label_packages` | NDC codes and package details for one DailyMed label, by set id. |

## Data source

DailyMed SPL services (NLM)
