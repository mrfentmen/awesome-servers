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

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `tracker_sdk_matrix`
* `project_health`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
