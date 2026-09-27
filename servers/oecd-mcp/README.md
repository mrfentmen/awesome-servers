# OECD MCP

OECD economic data from the public SDMX API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `indicator`  Indicator series.

* `nad_data`
* `dataflows`
## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public OECD SDMX API.
