# tally-mcp

Query Tally (key; set TALLY_API_KEY, Bearer): forms, form details, submissions.

## Tools

- `list_forms` — All Tally forms, with id and title.
- `get_form` — One form's structure: blocks, fields and settings.
- `list_submissions` — Responses submitted through this form, newest first.

- `list_webhooks` — Form webhooks.
- `get_webhook` — Webhook details.

## Source

[tally-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/tally-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `form_logic_audit`
* `completion_estimate`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-tally-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
