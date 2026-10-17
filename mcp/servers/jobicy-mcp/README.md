# Jobicy MCP

Remote jobs from the public Jobicy API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `jobs`  List remote jobs, filtered by region (geo), industry or skill tag.
* `job_details`  Get full descriptions for jobs matching a title, company or skill, searched across the 50 most recent postings.
* `industries`  List the industries hiring the most remote workers right now, with open job counts.
* `top_salaries`  List the highest-paying remote jobs that publish a salary, annualized for comparison.
* `companies`  Rank the companies with the most open remote jobs, including how many disclosed pay and the top published salary.
* `job_levels`  Break remote hiring down by experience level and employment type, with the highest published salary in each level.
* `geographies`  Break the most recent remote jobs down by region, with the top published pay in each place.
* `company_jobs`  List every open remote job from one company in the most recent postings, newest first.
* `salary_bands`  Show how published remote salaries are distributed, with the median and the share of jobs that disclose pay.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Jobicy API.


