# DataCite MCP

Search research datasets and DOIs from the public DataCite API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search`  Search DOIs.
* `doi`  Details for one DOI.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public DataCite API, the global research DOI registry.


