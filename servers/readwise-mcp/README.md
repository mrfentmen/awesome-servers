# readwise-mcp

Query Readwise (token; set READWISE_TOKEN, Token header): auth check, books, highlights.

## Tools

- `auth` — Check that the Readwise token works.
- `list_books` — Library sources: books, articles and podcasts.
- `list_highlights` — Recent highlights across the library.

## Source

[readwise-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/readwise-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `paper_search`
* `paper_references`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-readwise-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
