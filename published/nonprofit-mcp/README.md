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

These tools need a license key:

* `state_sector_census`
* `filing_recency_audit`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-nonprofit-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
