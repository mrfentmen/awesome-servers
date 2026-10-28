# segaretro mcp

MCP server for **Sega Retro**, the wiki covering every Sega game, console, and unreleased hardware.

## Tools

| Tool | What it does |
|---|---|
| `search_pages` | Search the Sega wiki |
| `get_page` | Read a page's content as plain text |
| `list_category` | List pages in a category (`Category:Games`, `Category:Consoles`…) |

## Usage

```bash
npm run build && node dist/index.js
```

Example:

```
search_pages { query: "Sonic the Hedgehog" }
get_page { title: "Sonic the Hedgehog (16-bit)" }
list_category { category: "Category:Consoles" }
```

Keyless (MediaWiki API). Covers hardware revisions, prototype differences, and obscure regional releases most other wikis skip.
