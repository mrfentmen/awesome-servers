# hiddenpalace mcp

MCP server for **hiddenpalace.org**, the Video Game History Foundation wiki documenting unreleased game prototypes, beta builds, and cut content.

## Tools

| Tool | What it does |
|---|---|
| `search_pages` | Search prototype/beta documentation |
| `get_page` | Read a page's content (wikitext flattened to readable text) |

## Usage

```bash
npm run build && node dist/index.js
```

Example:

```
search_pages { query: "Sonic Riders prototype" }
get_page { title: "Sonic Riders (NPDP prototype)" }
```

Keyless (MediaWiki API). Pairs perfectly with archive org mcp, the Internet Archive hosts many of the prototype ROMs that hiddenpalace documents.
