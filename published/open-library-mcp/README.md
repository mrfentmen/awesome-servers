# open-library-mcp

Open Library search, works, authors, editions, and ISBN.

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `searchBooks` — Search Open Library.
- `getWork` — Metadata for a work.
- `getAuthor` — Metadata for an author.
- `listEditions` — Editions of a work.
- `isbnLookup` — Look up a book by ISBN.
- `isbnValidate` — Validate an ISBN checksum.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Source

Public free APIs only. See `src/api.ts` for exact endpoints.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
