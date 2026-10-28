# library-of-congress-mcp

Search the Library of Congress catalogue, collections and digitised items - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/library-of-congress-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "library-of-congress-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/library-of-congress-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search` | Search the Library of Congress catalogue |
| `item_detail` | One digitised item by Library of Congress id |
| `collections` | List Library of Congress digital collections |
| `collection_detail` | One collection with item count and summary |
| `search_format` | Search the catalogue filtered by original format |

## Data source

Library of Congress
