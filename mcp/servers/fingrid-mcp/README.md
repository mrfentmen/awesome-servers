# fingrid-mcp

Fingrid Finnish grid open data: datasets and records. Needs free key.

## Setup

```bash
export FINGRID_API_KEY=...
```

Key goes in the x-api-key header. Free from data.fingrid.fi (10k req/day).

## Tools

- `list_datasets` — Fingrid open datasets with ids for record queries.
- `get_records` — Records from a Fingrid dataset in a time window.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `best_cheap_window`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
