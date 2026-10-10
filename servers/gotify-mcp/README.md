# gotify-mcp

Query any Gotify server (self-hosted; set GOTIFY_BASE_URL + GOTIFY_TOKEN, sent as X-Gotify-Key): send messages, list messages, list applications.

## Tools

- `send_message` — Push a notification via Gotify.
- `list_messages` — Messages stored on the Gotify server, newest first.
- `list_apps` — Registered Gotify applications.

## Source

[gotify-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/gotify-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `alert_payload`
* `retry_schedule`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-gotify-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
