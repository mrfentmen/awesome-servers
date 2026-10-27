# PoetryDB

Public-domain poetry from PoetryDB: find poems by author or title, read the lines, or pull a random one - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/poetrydb-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "poetrydb-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/poetrydb-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `poems_by_author` | Poems by one author, with their lines. |
| `poems_by_title` | Poems whose title matches, with author and lines. |
| `find_poem` | One poem by both author and title. |
| `random_poem` | A random poem (or a few) from the collection. |

## Data source

PoetryDB (public domain poetry collection)
