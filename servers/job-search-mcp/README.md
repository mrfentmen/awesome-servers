# Job Search MCP

Search remote job listings from the Remotive public feed. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search_jobs`  Search remote jobs.
* `job_categories`  List categories.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Jobs come from the public Remotive API. Postings change daily.
