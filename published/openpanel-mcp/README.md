# openpanel-mcp

OpenPanel analytics: metrics, live visitors, top pages, referrers. Needs client credentials.

## Setup

```bash
export OPENPANEL_CLIENT_ID=...
```

Needs OpenPanel client id + secret (OPENPANEL_CLIENT_SECRET) with read access. Sent as HTTP Basic.

## Tools

- `get_metrics` — OpenPanel visitors, sessions, bounce rate and engagement for a project.
- `get_live` — Current active OpenPanel visitor count for a project.
- `get_pages` — Top OpenPanel pages by sessions for a project.
- `get_referrer` — OpenPanel traffic sources for a project.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
