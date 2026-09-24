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

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).
