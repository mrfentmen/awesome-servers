# nylas-mcp

Query the Nylas v3 API (free tier key; set NYLAS_API_KEY, Bearer): grant info, calendars, recent messages.

## Tools

- `get_grant` — Which account the grant connects, and its provider.
- `list_calendars` — Calendars on the grant, with id and name.
- `list_messages` — Recent email messages, newest first.

## Source

[nylas-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/nylas-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `grant_flow_audit`
* `message_object_audit`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-nylas-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
