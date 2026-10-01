# Arbeitnow MCP

German job postings from the public Arbeitnow API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `jobs`  List the newest Arbeitnow job postings, 250 per page, with tags, location and remote flag.
* `search_jobs`  Search the 500 newest Arbeitnow jobs by title, company, location, tag or job type.
* `remote_jobs`  List only the remote-friendly jobs among the 500 newest Arbeitnow postings.
* `job`  Get one Arbeitnow job by its slug, including the full description and apply link.
* `tags`  Show which skills and categories appear most often in the newest Arbeitnow jobs.
* `companies`  Rank the employers with the most open Arbeitnow postings, with their remote count and newest posting date.
* `locations`  Show where the newest Arbeitnow jobs are, split by city and by job type, with a remote versus on-site count.
* `company_jobs`  List every open posting from one employer across the 300 newest Arbeitnow jobs, newest first.
* `similar_jobs`  Other Arbeitnow postings that share tags with a job, or come from the same employer, ranked by overlap.
* `hiring_trends`  New Arbeitnow postings per day, the remote share and the job types, over up to six feed pages.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Arbeitnow API.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `related_tags`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
