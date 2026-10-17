# Freeipapi MCP

IP geolocation from freeipapi.com for any IPv4 address. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools

* `lookup`  Geolocate an IP address.
* `current`  Geolocate the current caller IP.

## Usage

```bash
npm install
npm run build
node dist/index.js
```


