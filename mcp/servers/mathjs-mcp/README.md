# math.js MCP

Evaluate a maths expression on the math.js API. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/mathjs-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "mathjs-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/mathjs-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `evaluate` | Evaluate a math.js expression |

## Notes

The service evaluates math.js expressions: arithmetic, units, matrices and functions such as sqrt, sin or derivative.

## Licence

MIT
