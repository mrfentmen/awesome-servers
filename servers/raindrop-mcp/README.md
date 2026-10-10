# raindrop-mcp

Query Raindrop.io (token; set RAINDROP_TOKEN, Bearer): user, collections, bookmarks.

## Tools

- `user` — The Raindrop account the token belongs to.
- `collections` — Bookmark collections with counts and ids.
- `raindrops` — Bookmarks in one collection, with tags and links.

## Source

[raindrop-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/raindrop-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `link_preview`
* `book_lookup`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-raindrop-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
