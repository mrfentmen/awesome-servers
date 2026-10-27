# Project Gutenberg MCP

Project Gutenberg via Gutendex: 79,000+ public domain books with summaries and download links — keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y gutenberg-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "gutenberg-mcp": { "command": "npx", "args": ["-y", "gutenberg-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_books` | Search by title or author |
| `book_detail` | Summary plus every download format |
| `popular_books` | The most downloaded books |
| `books_by_language` | Most downloaded books in one language |

## Example

```
1. Pride and Prejudice
   Austen, Jane (1775–1817) · en · 190,246 downloads
   id 1342
```

## Notes

Gutendex is sometimes slow (topic queries have been measured at 80 seconds), so the server gives each call a long window and says so honestly when it times out. Book detail needs the trailing-slash path; that is handled internally.

## Licence

MIT
