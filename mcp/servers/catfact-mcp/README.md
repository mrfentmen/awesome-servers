# Cat Fact

Cat facts and breed data from catfact.ninja - a random fact, fact browsing by page, and the cat breed list, keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/catfact-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "catfact-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/catfact-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `random_cat_fact` | One random cat fact. |
| `cat_breeds` | The cat breed list with country of origin, coat and pattern. |
| `list_facts` | Browse the cat fact database page by page. |

## Data source

catfact.ninja, a keyless cat fact and breed API.
