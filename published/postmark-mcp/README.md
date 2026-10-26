# postmark-mcp

Query the Postmark API (free tier server token; set POSTMARK_SERVER_TOKEN, sent as X-Postmark-Server-Token): server info, templates, outbound messages.

## Tools

- `get_server` — Postmark server details and delivery settings.
- `list_templates` — Email templates on the server, with ids.
- `list_outbound` — Recent outbound messages with recipient and status.

## Source

[postmark-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/postmark-mcp)

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
