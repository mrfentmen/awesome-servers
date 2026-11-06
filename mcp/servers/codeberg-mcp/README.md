# Codeberg MCP

Search public repositories hosted on Codeberg. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/codeberg-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "codeberg-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/codeberg-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `repos` | Search Codeberg repositories |

## Notes

Codeberg is a non-profit Forgejo host. Public repository metadata is readable without a token.

## Licence

MIT
