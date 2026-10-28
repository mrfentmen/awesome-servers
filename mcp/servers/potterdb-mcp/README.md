# Potter DB

Harry Potter world data from Potter DB - character search, full character profiles, spell search and the book list, keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/potterdb-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "potterdb-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/potterdb-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_characters` | Search Harry Potter characters by name fragment, with house, species and birth details. |
| `character_detail` | Full profile for one character by slug: house, blood status, patronus, boggart, wands, family, titles and wiki link. |
| `search_spells` | Search spells by name, with incantation, category and effect. |
| `list_books` | The Potter DB book list with release dates, page counts and summaries. |

## Data source

Potter DB (api.potterdb.com), a community database of Harry Potter characters, spells, potions and books.
