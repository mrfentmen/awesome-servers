# Job Search MCP

Search remote job listings from the Remotive public feed. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search_jobs`  Search six public job boards at once (Jobicy, Arbeitnow, RemoteOK, The Muse, Remotive, Hacker News) and get merged, de-duplicated results with company, location, salary where the board exposes one, and a link. Use this for any job hunt.
* `latest_jobs`  The newest postings across all six boards, newest first, with no keyword needed. Good for 'what jobs came out today'.
* `jobs_by_board`  Query one specific job board on its own, for when you want a single source instead of the merged feed. Jobicy and Hacker News filter server-side; the others are filtered over their latest postings.
* `company_jobs`  Every open posting at a company across all six boards, matched on the company name. Useful before an interview or when tracking a shortlist.
* `job_categories`  The job boards this server aggregates, their ids, and how each one filters — so an agent knows which board to target for a given query.
* `salary_insights`  Scan the job boards for a keyword and summarise the pay that postings actually disclosed: lowest, median and highest USD-per-year figure, plus the best paying matches.
* `board_coverage`  Compare how many jobs each aggregated board returns for a query, and report which boards are unreachable, so an agent knows where a search is actually coming from.
* `jobs_last_hours`  Postings published inside a time window - what is actually new, with a per-board count.
* `skill_demand`  Which skills, tags and companies appear most often across the boards' latest postings.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Jobs come from the public Remotive API. Postings change daily.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `hiring_thread`
* `role_taxonomy`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
