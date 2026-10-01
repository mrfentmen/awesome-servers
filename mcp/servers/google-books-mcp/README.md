# google-books-mcp

Query Google Books (keyless quota is shared and may 429; set GOOGLE_BOOKS_API_KEY from Google Cloud Console for your own quota): volume search and details with covers, pages, categories.

## Tools

- `search_books` — Search Google Books volumes by title or author.
- `get_volume` — One volume by id, with description and ISBNs.

## Source

[google-books-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/google-books-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `isbn_lookup`
* `author_works`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-google-books-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
