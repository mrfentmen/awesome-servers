# chmi-mcp

Keyless Czech CHMI open data browser: warnings, forecasts, radar, climate files and downloads.

## Setup

No API key needed.

## Tools

- `browse` — List CHMI open-data directories and files, e.g. '/', 'meteorology/weather/alerts/'.
- `get_file` — Download a CHMI open-data text file (CSV, XML, JSON, TXT), truncated.
- `get_latest_alert` — Newest CHMI weather warning file content.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `directory_stats`
* `directory_tree`
* `find_documents`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
