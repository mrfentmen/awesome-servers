# ntfy-mcp

Use ntfy.sh (keyless; optional NTFY_BASE_URL + NTFY_TOKEN): publish notifications, poll a topic as JSON. Publishing is real.

## Tools

- `publish` — Send a REAL notification to a topic.
- `poll` — Messages cached on a topic, as JSON, since a given time.

- `health` — ntfy server status.
- `account` — Tier and limits.
- `poll_since` — Messages after an ID.
- `send_urgent` — Max-priority REAL push.
- `send_scheduled` — Delayed REAL push.
- `send_email` — REAL email + push.
- `send_call` — REAL phone call.
- `publish_tags` — Push with emoji tags.

## Source

[ntfy-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/ntfy-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `ntfy_server_capabilities`
* `topic_message_history`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-ntfy-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
