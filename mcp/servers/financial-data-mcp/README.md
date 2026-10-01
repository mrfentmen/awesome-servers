# Financial Data MCP

Read economic data from FRED and daily US Treasury rates. No API key is required for either source.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `get_fred_series`  Any FRED series such as GDP, UNRATE, or CPIAUCSL.
* `get_treasury_rates`  Current Treasury yield curve rates.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

FRED data is read from the public CSV endpoint. Treasury data comes from the Fiscal Data API.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `series_trend`
* `treasury_curve_history`
* `series_window`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
