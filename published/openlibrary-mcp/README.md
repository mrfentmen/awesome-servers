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
- `edition_by_isbn` — Resolve an ISBN straight to its edition record - title, publisher, pages, language and cover - after checking the ISBN's own check digit, so a typo is caught before the request.
- `work_editions` — Every printing of a work that Open Library holds: edition count, publication-year range, publishers, languages and the edition keys to drill into.
- `subject_overview` — A subject as an entity rather than a search: how many works it holds and the works Open Library ranks first, with authors and first publication years.

## Source

[openlibrary-mcp](https://github.com/mrfentmen/awesome-servers)
