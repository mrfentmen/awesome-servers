# nonprofit-mcp

US nonprofit profiles and finances by EIN - no API key.

## Tools

- `search` — Search US nonprofits by name. Returns EIN, location and NTEE code for each match.
- `search_by_state` — List nonprofits registered in a US state.
- `search_by_category` — Find nonprofits by NTEE category, optionally within one state. Accepts the NTEE letter (A arts, B education, C environment, E health, P human services, S community) or a full code like 'B20'.
- `details` — Full profile for one EIN: address, ruling date, latest revenue and expenses, and a link to the newest Form 990.
- `financial_summary` — Revenue, expenses and net result year by year for one EIN, with the change over the period.
- `compare` — Put up to 5 nonprofits side by side: location, category, revenue and expenses.
- `search_by_subsection` — Nonprofits by IRS subsection: 501(c)(3), (c)(4), (c)(6) and the rest, optionally within one state.
- `filings` — Every Form 990 on record for one EIN: year, form type, revenue, expenses, assets and the PDF links.

## Setup

No setup. Data comes from public IRS filings via the ProPublica Nonprofit Explorer.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `state_sector_census`
* `filing_recency_audit`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
