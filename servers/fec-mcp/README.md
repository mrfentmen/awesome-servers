# FEC MCP

US campaign finance data from the public FEC API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `candidates`  Search candidates.

* `committees`
* `filings`
* `schedule_a`
* `schedule_b`
* `candidate_totals`
* `elections`
## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public FEC open data API.
