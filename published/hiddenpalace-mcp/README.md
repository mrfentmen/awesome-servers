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

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_pages`: Search hiddenpalace.org - unreleased prototypes, beta builds, and
- `get_page`: Get a page

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `search_pages`.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
