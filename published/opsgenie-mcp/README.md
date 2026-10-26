# opsgenie-mcp

Query the Opsgenie API (free tier key; set OPSGENIE_API_KEY, sent as GenieKey): alerts, alert details, on-calls.

## Tools

- `list_alerts` — Open alerts, with priority, owner and created time.
- `get_alert` — One alert by id, with description and timeline.
- `list_oncalls` — Who is on call now, per rotation and schedule.

## Source

[opsgenie-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/opsgenie-mcp)

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
