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

These tools need a licence key:

* `loc_catalog`
* `book_background`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
