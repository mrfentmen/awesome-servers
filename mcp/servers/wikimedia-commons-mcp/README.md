# Wikimedia Commons MCP

Search free images, audio and video on Wikimedia Commons. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/wikimedia-commons-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "wikimedia-commons-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/wikimedia-commons-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_media` | Search Commons media files |

## Notes

Namespace 6 is the file namespace, so results are media files rather than gallery pages. Snippets may contain HTML.

## Licence

MIT
