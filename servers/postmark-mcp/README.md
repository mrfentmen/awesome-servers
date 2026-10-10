# postmark-mcp

Query the Postmark API (free tier server token; set POSTMARK_SERVER_TOKEN, sent as X-Postmark-Server-Token): server info, templates, outbound messages.

## Tools

- `get_server` — Postmark server details and delivery settings.
- `list_templates` — Email templates on the server, with ids.
- `list_outbound` — Recent outbound messages with recipient and status.

## Source

[postmark-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/postmark-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `blacklist_check`
* `mail_policy_report`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-postmark-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
