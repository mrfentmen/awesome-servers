# feedly-mcp

Query Feedly (token; set FEEDLY_TOKEN, Bearer): profile, subscriptions, stream contents.

## Tools

- `profile` — The Feedly account the token belongs to.
- `subscriptions` — Feeds the account follows, with titles.
- `stream_contents` — Recent entries in a stream, newest first.

## Source

[feedly-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/feedly-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `unread_counts`
* `board_catalogue`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-feedly-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
