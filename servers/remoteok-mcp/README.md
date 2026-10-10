# RemoteOK MCP

Remote jobs from the public RemoteOK API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `jobs`  List the newest remote jobs from RemoteOK, with pay range when published.
* `search`  Search RemoteOK jobs by tag or skill, for example python or react.
* `job`  Get one RemoteOK job by id, including the full description and apply link.
* `top_salaries`  List the remote jobs in the live feed that publish the highest salaries.
* `companies`  List the companies hiring the most on RemoteOK right now, with opening counts.
* `tags`  Show which skills and tags appear most often in the live RemoteOK feed.
* `newest_jobs`  Remote jobs posted inside a time window, newest first, with the tags and companies active in that window. The feed itself is unfiltered.
* `tag_combinations`  Find roles carrying every tag given, e.g. react plus senior, which the feed's single-tag filter cannot express, with the pay range they publish.
* `company_jobs`  Every open role from one company on the feed, with the tag mix across its roles and the salary range it publishes.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public RemoteOK API.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `market_census`
* `salary_by_tag`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
