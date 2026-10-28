# Fruityvice

Fruit nutrition data: calories, sugar, fat and carbs per fruit, with lookup by name and nutrient ranges - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/fruityvice-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "fruityvice-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/fruityvice-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `all_fruits` | The whole fruit catalogue with nutrition per 100 g. |
| `fruit_by_name` | One fruit by name, with family, genus and nutrition. |
| `fruits_by_nutrient` | Fruits whose nutrient value falls inside a range. |

## Data source

Fruityvice API
