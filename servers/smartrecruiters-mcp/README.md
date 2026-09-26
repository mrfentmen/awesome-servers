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

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public SmartRecruiters API.
