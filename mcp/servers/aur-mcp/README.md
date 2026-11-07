# Arch User Repository MCP

Search Arch Linux AUR packages, versions and vote counts. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/aur-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "aur-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/aur-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_packages` | Search AUR packages |

## Notes

The RPC API needs no key. Search matches names and descriptions; votes and popularity show community interest.

## Licence

MIT
