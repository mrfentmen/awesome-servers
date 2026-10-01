# calcom-mcp

Query Cal.com API v2 (key; set CAL_API_KEY, Bearer + version header): event types, bookings, schedules. v1 is decommissioned.

## Tools

- `list_event_types` — Scheduling links people can book, with duration.
- `list_bookings` — Upcoming bookings with attendee and start time.
- `list_schedules` — Availability schedules and their timezones.

- `event_type` — Single event type.
- `booking` — Booking by UID.
- `schedule` — Schedule by ID.
- `teams` — All teams.
- `team_details` — Single team.
- `webhooks` — Registered webhooks.
- `me` — Authenticated user.

## Source

[calcom-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/calcom-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `slot_density`
* `public_event_types`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-calcom-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
