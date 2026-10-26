# pusher-mcp

Query the Pusher HTTP API (free tier; set PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER; requests HMAC-signed with node:crypto, stdlib only): channels, channel details, channel users.

## Tools

- `list_channels` — Active channels with user counts.
- `get_channel` — Occupancy details for a channel.
- `get_channel_users` — User IDs subscribed to a presence channel.

## Source

[pusher-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/pusher-mcp)

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
