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

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).
