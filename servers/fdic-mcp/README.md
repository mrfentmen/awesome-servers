# FDIC MCP

Read FDIC insured institution data: search banks by name and list the largest by assets. No API key is required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search_institutions`  Search insured institutions by name.
* `get_largest_banks`  Largest institutions by assets.

* `bank_failures`
* `bank_history`
* `bank_locations`
* `bank_financials`
* `fdic_summary`
## Usage

```bash
npm install
npm run build
node dist/index.js
```

The FDIC public API is free and keyless.
