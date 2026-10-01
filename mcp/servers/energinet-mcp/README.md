# energinet-mcp

Keyless Danish Energinet electricity data: live power system plus any open dataset.

## Setup

No API key needed.

## Tools

- `get_power_now` — Live Danish power system: production, consumption, exchange right now.
- `get_dataset` — Rows from any Energinet open dataset by name.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `day_ahead_prices`
* `carbon_trend`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
