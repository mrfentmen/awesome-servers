# BLS MCP

US labor statistics from the public BLS API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `series`  Get a BLS series.

* `latest_value`
* `series_range`
* `popular_series`
* `list_surveys`
## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public BLS API.
