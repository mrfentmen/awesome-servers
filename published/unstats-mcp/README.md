# UN SDG Data

UN Sustainable Development Goals: goal list, indicators and official indicator data - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/unstats-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "unstats-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/unstats-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `list_sdg_goals` | All 17 Sustainable Development Goals with descriptions. |
| `indicators_for_goal` | Indicators that measure one SDG goal. |
| `indicator_data` | Official data rows for an indicator code. |

## Data source

UN Statistics Division SDG API
