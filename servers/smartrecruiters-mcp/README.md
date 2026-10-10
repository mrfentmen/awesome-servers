# SmartRecruiters MCP

Job postings from the public SmartRecruiters API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `jobs`  List a company SmartRecruiters job postings with location, department and posting id.
* `posting`  Get one SmartRecruiters posting by id, with the full job description and apply link.
* `search_postings`  Search a company SmartRecruiters board by title, location, department or function.
* `departments`  Show a company SmartRecruiters hiring split by department, function, industry and experience level.
* `search_all_jobs`  Search SmartRecruiters job postings across every company at once, with optional country and remote filters.
* `hiring_companies`  Rank the companies posting the most SmartRecruiters jobs for a keyword, with a sample role each.
* `postings_page`  Page deeper into a company board by offset, so a board with thousands of postings can be read past the newest hundred.
* `postings_by_country`  One country's postings from a company board, filtered by the API itself, with the share of the whole board that country represents.
* `board_overview`  A company board as a whole: posting count, countries, departments, experience levels, contract types and how much of it is remote.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public SmartRecruiters API.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `posting_age`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
