# pusher-mcp

Query the Pusher HTTP API (free tier; set PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER; requests HMAC-signed with node:crypto, stdlib only): channels, channel details, channel users.

## Tools

- `list_channels` — Active channels with user counts.
- `get_channel` — Occupancy details for a channel.
- `get_channel_users` — User IDs subscribed to a presence channel.

## Source

[pusher-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/pusher-mcp)


