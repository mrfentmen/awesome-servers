# Berlin BVG MCP

Berlin transit data from the public transport.rest API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `stops`  Search stops.
* `departures`  Departures at a stop.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public transport.rest API.
