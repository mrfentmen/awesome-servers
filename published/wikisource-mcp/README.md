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
