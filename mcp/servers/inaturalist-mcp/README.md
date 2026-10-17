# iNaturalist MCP

Search species and read recent observations from the public iNaturalist API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search_species`  Search species.
* `recent_observations`  Recent observations.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public iNaturalist API.


