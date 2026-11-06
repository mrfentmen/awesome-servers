# Chuck Norris MCP

Random Chuck Norris jokes from the public joke API. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/chucknorris-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "chucknorris-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/chucknorris-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `random_joke` | Random Chuck Norris joke, optionally from one category |
| `categories` | All available joke categories |

## Notes

The joke API also exposes categories such as animal, career and food. Pass one to narrow the pool.

## Licence

MIT
