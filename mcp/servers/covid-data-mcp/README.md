# COVID Data MCP

COVID 19 statistics from the public disease.sh API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `country`  Stats for one country.
* `global`  Global totals.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public disease.sh API.


