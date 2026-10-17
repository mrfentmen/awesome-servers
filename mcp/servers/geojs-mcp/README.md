# GeoJS MCP

IP geolocation from the public GeoJS API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `lookup`  Look up an IP.
* `self`  Geolocate the caller.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public GeoJS API.


