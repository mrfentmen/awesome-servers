# openlibrary-mcp

Query the Open Library (openlibrary.org, keyless): full-text book search, work details, and author details with covers and publish years.

## Tools

- `search_books` — Search Open Library by title, author or free text. Returns authors, first publish year and cover links.
- `search_by_author` — Find books by an author name across the whole Open Library catalog.
- `search_by_subject` — Browse a subject or genre, e.g. 'science_fiction', 'cooking', 'biography'.
- `get_work` — Work details by ID (OL123W): description, subjects, first publish date and cover.
- `get_edition` — Edition details by ID (OL123M): publisher, page count, ISBNs and cover.
- `get_author` — Author details by ID (OL123A): birth/death dates, alternate names, bio and links.
- `author_works` — List the works credited to an author ID, with publication years.

## Source

[openlibrary-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/openlibrary-mcp)
