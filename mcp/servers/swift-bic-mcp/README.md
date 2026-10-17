# SWIFT BIC MCP

Look up SWIFT and BIC bank codes from a bundled directory. No network, no key, the query stays local.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search`  Search bank codes.
* `validate`  Check BIC format.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

The directory bundles common bank BICs for validation and search. Coverage is best effort and not exhaustive.


