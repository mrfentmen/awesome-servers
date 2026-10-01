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

These tools need a licence key:

* `websocket_round_trip`
* `websocket_payload_probe`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
