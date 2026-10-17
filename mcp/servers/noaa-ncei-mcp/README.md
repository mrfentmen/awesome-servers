# NOAA NCEI MCP

US weather station daily summaries from the public NOAA NCEI API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `summary`  Daily summary.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public NOAA NCEI API.


