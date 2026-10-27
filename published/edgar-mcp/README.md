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

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
