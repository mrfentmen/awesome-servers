# Workable MCP

Public job boards from the Workable API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search_jobs` — Search live roles on company career sites powered by Workable (roughly 170,000 open jobs). Filter by keyword, location or both.
* `job_detail` — Full posting for one job: company, location, contract type, apply link and the description text.
* `company_jobs` — Every open role on one company's Workable board, e.g. board 'stealth-it'.
* `companies` — Which companies are hiring for a keyword, ranked by how many roles they have open.
* `market_summary` — Rough shape of the job market for a keyword: top employers, locations, contract types and departments.
* `remote_jobs` — List only remote, hybrid or on-site roles, using Workable's own workplace filter rather than sorting through mixed results.
* `recent_jobs` — Sort Workable results by posting date, newest first, and report how fresh the sample actually is.
* `compare_queries` — Open-role counts for two to five searches side by side, ranked, using the API's own totals - a direct read on which skill the market is hiring for.
* `company_openings` — Every open role from one employer, found through the market search and filtered to that company, with its workplace mix.
* `workplace_split` — How a search splits between remote, hybrid and on-site roles, using the API's own workplace filter on each of the three counts.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Workable API.
