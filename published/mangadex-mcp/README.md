# mangadex mcp

Search the [MangaDex](https://mangadex.org) library (API v5). Free, no auth.

## Tools

- `search_manga`, title, authors, year, status, tags, description
- `get_manga`, full detail for a manga UUID
- `list_chapters`, chapters with volumes, scanlation groups, page counts
- `search_author`, find mangaka by name
- `list_tags`, the full tag taxonomy (build search filters from it)

## Run

```bash
npm install && npm run build && node dist/index.js
```

## Example

> "What's the newest English Berserk chapter?"
> `search_manga("Berserk")` → `list_chapters(<id>, "en", oldestFirst=false)`
