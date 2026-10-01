# pusher-mcp

Query the Pusher HTTP API (free tier; set PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER; requests HMAC-signed with node:crypto, stdlib only): channels, channel details, channel users.

## Tools

- `list_channels` — Active channels with user counts.
- `get_channel` — Occupancy details for a channel.
- `get_channel_users` — User IDs subscribed to a presence channel.

## Source

[pusher-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/pusher-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `websocket_round_trip`
* `websocket_payload_probe`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-pusher-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
