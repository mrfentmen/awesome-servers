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

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `page_summary`
* `page_categories`
* `page_history`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
