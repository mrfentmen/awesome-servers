# OSRM MCP

Driving, cycling, and walking routes and nearest road lookups from the public OSRM demo server. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `route`  Route between coordinates.
* `nearest`  Nearest road point.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public OSRM demo server. Commercial routing APIs charge per request, this one is free.


