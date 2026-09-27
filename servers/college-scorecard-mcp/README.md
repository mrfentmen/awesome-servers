# College Scorecard MCP

US college data from the public College Scorecard API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search`  Search colleges.

* `by_state`
* `by_city`
* `school_details`
* `by_ownership`
* `top_earnings`
## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public US Department of Education College Scorecard API.
