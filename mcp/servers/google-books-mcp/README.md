# google-books-mcp

Query Google Books (keyless quota is shared and may 429; set GOOGLE_BOOKS_API_KEY from Google Cloud Console for your own quota): volume search and details with covers, pages, categories.

## Tools

- `search_books` — Search Google Books volumes by title or author.
- `get_volume` — One volume by id, with description and ISBNs.

## Source

[google-books-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/google-books-mcp)

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `isbn_lookup`
* `author_works`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
