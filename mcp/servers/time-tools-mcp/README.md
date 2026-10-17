# Time Tools MCP

Convert timestamps, compute date differences, and format durations on the local machine. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `now`  Current time.
* `from_timestamp`  Unix timestamp to date.
* `date_diff`  Days between dates.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

All processing happens locally.


