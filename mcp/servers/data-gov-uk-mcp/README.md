# data.gov.uk MCP

UK government open data search from the public data.gov.uk CKAN API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search`  Search packages.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public data.gov.uk CKAN API.


