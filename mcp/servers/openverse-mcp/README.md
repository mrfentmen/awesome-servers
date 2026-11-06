# Openverse MCP

Search openly licensed images and audio from Creative Commons. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/openverse-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "openverse-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/openverse-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `images` | Search openly licensed images |

## Notes

Openverse indexes openly licensed media from Flickr, Wikimedia, museums and more. Each result links to the original and its licence.

## Licence

MIT
