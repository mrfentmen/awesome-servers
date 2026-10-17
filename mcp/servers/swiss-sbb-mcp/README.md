# Swiss SBB MCP

Swiss rail data from the public transport.opendata.ch API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `connections`  Connections between stations.
* `stationboard`  Departures at a station.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public transport.opendata.ch API.


