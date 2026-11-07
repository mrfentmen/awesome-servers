# DiceBear MCP

Generate avatar images from any seed with DiceBear styles. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/dicebear-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "dicebear-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/dicebear-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `generate_avatar` | Avatar URL and SVG for a seed |

## Notes

The same seed always gives the same avatar. Styles include avataaars, bottts, initials and pixel-art.

## Licence

MIT
