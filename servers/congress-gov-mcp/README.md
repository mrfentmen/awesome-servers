# Congress.gov MCP

US legislation from the public Congress.gov API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `bills`  Recent bills.
* `search`  Search bills.

* `bill_details`
* `bill_actions`
* `members`
* `member_details`
* `committees`
* `committee_details`
* `bill_summaries`
## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Congress.gov API.
