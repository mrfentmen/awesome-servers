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

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public RemoteOK API.
