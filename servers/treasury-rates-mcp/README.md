# Treasury Rates MCP

US Treasury foreign exchange rates from the public Fiscal Data API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `rates`  Treasury FX rates.

* `avg_interest`
* `debt_total`
* `mts_spending`
* `cash_ops`
* `debt_penny`
## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public US Treasury Fiscal Data API. Financial data feeds charge commercially elsewhere.
