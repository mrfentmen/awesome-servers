# swetrix-mcp

Swetrix analytics: projects and project details. Needs API key.

## Setup

```bash
export SWETRIX_API_KEY=...
```

## Tools

- `list_projects` — All Swetrix projects with ids and domains.
- `get_project` — One Swetrix project with settings and stats summary.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `sdk_release_feed`
* `ecosystem_audit`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
