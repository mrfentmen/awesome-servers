# Bible API

Read Bible verses and passages in 30+ translations, with reference lookup and a random verse - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/bible-api-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "bible-api-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/bible-api-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `get_passage` | Fetch a verse, chapter or passage by reference. |
| `random_verse` | One random verse from a translation. |
| `list_translations` | Every translation the service offers, with language and licence. |

## Data source

bible-api.com (public domain and freely licensed translations)
