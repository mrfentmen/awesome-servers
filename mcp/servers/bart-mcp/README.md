# BART MCP

Bay Area Rapid Transit departures from the public BART API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `etd`  Departures for a station.
* `stations`  List stations.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public BART API.


