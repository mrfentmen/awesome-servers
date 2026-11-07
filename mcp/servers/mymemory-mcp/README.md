# MyMemory MCP

Free machine translation between more than 100 languages. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/mymemory-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "mymemory-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/mymemory-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `translate` | Translate text between two languages |

## Notes

Language pairs use ISO codes, e.g. en|es. Anonymous use has a daily character limit; no key is needed.

## Licence

MIT
