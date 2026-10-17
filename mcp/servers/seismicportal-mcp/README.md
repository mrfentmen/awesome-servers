# Seismic Portal MCP

Earthquake data from the public EMSC seismic portal. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `recent`  Recent earthquakes.
* `significant`  Significant earthquakes.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public EMSC seismic portal.


