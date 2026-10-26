# novu-mcp

Query Novu (key; set NOVU_API_KEY, ApiKey header; optional NOVU_BASE_URL for EU): subscribers, topics, notifications.

## Tools

- `list_subscribers` — Notification subscribers, with email and id.
- `get_subscriber` — One subscriber by id, with channels and data.
- `list_topics` — Notification topics with subscriber counts.

- `topic_details` — Single topic.
- `notifications` — Templates list.
- `environments` — All environments.
- `integrations` — Providers.
- `layouts` — Email layouts.
- `feeds` — Notification feeds.
- `blueprint_groups` — Grouped blueprints.

## Source

[novu-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/novu-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `notification_api_audit`
* `novu_sdk_release_check`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-novu-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
