# Internet Archive MCP

Search books, audio and web items archived by the Internet Archive. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/internet-archive-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "internet-archive-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/internet-archive-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_items` | Search archive.org items |

## Notes

The advanced search covers millions of items. Identifiers can be opened at archive.org/details/<identifier>.

## Licence

MIT
