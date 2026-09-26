# Job Search MCP

## Tagline
Search remote job listings from the Remotive public feed. No key required.

## Description
Search remote job listings from the Remotive public feed. No key required. Published from a private commercial monorepo. Not affiliated with or endorsed by Job Search.

## Setup Requirements
- No configuration required. Works out of the box with no API keys.

## Category
Jobs

## Features

- Search jobs: Search six public job boards at once (Jobicy, Arbeitnow, RemoteOK, The Muse, Remotive, Hacker News) and get merged, de-duplicated results with company, location, salary where the board exposes one, and a link. Use this for any job hunt.
- Latest jobs: The newest postings across all six boards, newest first, with no keyword needed. Good for 'what jobs came out today'.
- Jobs by board: Query one specific job board on its own, for when you want a single source instead of the merged feed. Jobicy and Hacker News filter server-side; the others are filtered over their latest postings.
- Company jobs: Every open posting at a company across all six boards, matched on the company name. Useful before an interview or when tracking a shortlist.
- Job categories: The job boards this server aggregates, their ids, and how each one filters — so an agent knows which board to target for a given query.
- Salary insights: Scan the job boards for a keyword and summarise the pay that postings actually disclosed: lowest, median and highest USD-per-year figure, plus the best paying matches.
- Board coverage: Compare how many jobs each aggregated board returns for a query, and report which boards are unreachable, so an agent knows where a search is actually coming from.

## Getting Started

- "Ask your assistant about job search using this server once installed"
- Tool: search_jobs — Search six public job boards at once (Jobicy, Arbeitnow, RemoteOK, The Muse, Remotive, Hacker News) and get merged, de-duplicated results with company, location, salary where the board exposes one, and a link. Use this for any job hunt.
- Tool: latest_jobs — The newest postings across all six boards, newest first, with no keyword needed. Good for 'what jobs came out today'.
- Tool: jobs_by_board — Query one specific job board on its own, for when you want a single source instead of the merged feed. Jobicy and Hacker News filter server-side; the others are filtered over their latest postings.
- Tool: company_jobs — Every open posting at a company across all six boards, matched on the company name. Useful before an interview or when tracking a shortlist.
- Tool: job_categories — The job boards this server aggregates, their ids, and how each one filters — so an agent knows which board to target for a given query.
- Tool: salary_insights — Scan the job boards for a keyword and summarise the pay that postings actually disclosed: lowest, median and highest USD-per-year figure, plus the best paying matches.
- Tool: board_coverage — Compare how many jobs each aggregated board returns for a query, and report which boards are unreachable, so an agent knows where a search is actually coming from.

## Tags
job search, mcp, data, keyless

## Documentation URL
https://github.com/mrfentmen/premium-mcps/tree/main/servers/job-search-mcp
