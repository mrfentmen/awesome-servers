# The Muse MCP

Job postings from the public The Muse API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `jobs`  Browse the newest The Muse job postings (about 414,000 open roles), 20 per page, with company, location, level and category.
* `job`  Get one Muse job by id, including the full description text and landing page link.
* `find_jobs`  Search Muse jobs using the API's own level and location filters — faster and far more precise than scanning the feed. Example: level 'Senior Level' with location 'Remote'.
* `company_jobs`  Every open Muse role at companies matching a name, found by scanning the newest postings.
* `search_jobs`  Keyword search across the newest Muse postings (title, company, location, category, level, tags). Add a level or location to narrow what gets scanned.
* `job_insights`  Market overview for a level and/or location: the top employers, locations, levels and categories hiring right now. Supersedes a plain \"who is hiring\" company count.
* `list_companies`  Browse The Muse employer directory page by page: company, industries, locations and size, with the total number profiled.
* `company_search`  Search the employer directory by name, scanning several pages because the directory has no search parameter, and reports which page each match came from.
* `compare_companies`  Open-role counts for two to five employers side by side, ranked, so a shortlist of companies can be compared on actual hiring.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public The Muse API.
