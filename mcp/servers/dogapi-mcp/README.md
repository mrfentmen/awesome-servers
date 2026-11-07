# Dog API MCP

Dog breeds with temperament, lifespan and size from dogapi.dog. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/dogapi-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "dogapi-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/dogapi-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `list_breeds` | List dog breeds |

## Notes

Breed records follow JSON:API. The lifespan is a min and max in years; the description covers temperament.

## Licence

MIT
