# shynet-mcp

Self-hosted Shynet analytics: dashboard stats overall or per service with date range.

## Setup

```bash
export SHYNET_BASE_URL=...
```

Needs SHYNET_BASE_URL (your instance) plus SHYNET_API_TOKEN (personal API token).

## Tools

- `get_dashboard` — Shynet dashboard: visits, pageviews and stats across all services, last 30 days by default.
- `get_service_stats` — Shynet stats for one service (site) with date range.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).
