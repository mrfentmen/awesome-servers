# wikisource-mcp

Search and read bounded extracts from Wikisource, a useful source for public-domain texts, historical documents, speeches, translations, and primary-source research.

## Tools

- `search_texts`: search titles and snippets.
- `read_text`: read a bounded plain-text extract from a named page.

Wikisource pages can have different rights and edition notes. A page being available on Wikisource does not automatically make every scan, translation, or transcription reusable everywhere. Check the page's rights information before publishing or redistributing text. The server is read-only, keyless, and does not crawl arbitrary websites.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_texts`: Search Wikisource titles and snippets for texts and primary sources hosted on the project.
- `read_text`: Read a bounded plain-text extract from a Wikisource page. Verify the page

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `search_texts`.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
