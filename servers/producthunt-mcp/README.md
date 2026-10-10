# producthunt-mcp

Query Product Hunt GraphQL (token; set PRODUCTHUNT_TOKEN, Bearer): viewer, latest posts, post details.

## Tools

- `viewer` — The Product Hunt user the token belongs to.
- `list_posts` — Launches ranked by votes, with tagline and maker.

## Source

[producthunt-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/producthunt-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `show_hn_launches`
* `github_footprint`
* `competitive_scan`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-producthunt-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
