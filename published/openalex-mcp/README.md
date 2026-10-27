# OpenAlex MCP

A research metadata server for scholarly works and authors using the public OpenAlex API.

## Tools

* `search_works`
* `get_work`
* `search_authors`
* `get_author`

* `search_sources`
* `search_institutions`
* `search_topics`
* `search_publishers`
* `search_funders`
* `autocomplete_works`
Results include DOI, publication year, citations, open access links, venues, authors, and topics.

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

- `search_works`: Search scholarly works by title, topic, author, or keyword.
- `get_work`: Get one OpenAlex work by OpenAlex ID or URL.
- `search_authors`: Search OpenAlex authors and institutions.
- `get_author`: Get one OpenAlex author by ID or URL.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `search_works`.
