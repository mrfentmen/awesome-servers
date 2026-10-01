# isbndb-mcp

ISBNdb books: lookup by ISBN, search, batch lookup. Needs API key.

## Setup

```bash
export ISBNDB_API_KEY=...
```

Key goes in the raw Authorization header (no Bearer prefix).

## Tools

- `get_book` — ISBNdb book detail: title, authors, publisher, pages, cover.
- `search_books` — Search ISBNdb by title, author or subject with pagination.
- `get_books_batch` — Look up several ISBNdb books in one call.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `loc_catalog`
* `book_background`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-isbndb-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
