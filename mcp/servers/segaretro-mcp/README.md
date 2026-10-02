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

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_pages`: Search Sega Retro - every Sega game, console, and unreleased hardware.
- `get_page`: Get a page
- `list_category`: List pages in a Sega Retro category (e.g.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `search_pages`.

