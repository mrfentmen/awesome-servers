# SEC EDGAR MCP

Read SEC EDGAR data for any public company: recent filings, XBRL financial facts, and full text search. No API key is required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `get_company_filings`  Recent 8 K, 10 K, and 10 Q filings by ticker or CIK.
* `get_company_facts`  XBRL facts such as revenue, assets, and earnings.
* `search_filings`  Full text search over recent SEC filings.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

SEC asks for a descriptive User Agent. This server sends one automatically. It follows SEC fair use limits with bounded requests.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `company_profile`
* `frame_peers`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
