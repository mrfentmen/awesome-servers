# NDBC Buoy MCP

Real time ocean buoy observations from the public NOAA NDBC. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `station`  Latest observations.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public NOAA National Data Buoy Center. Marine data feeds charge commercially.


