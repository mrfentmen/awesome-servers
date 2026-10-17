# Bigdatacloud MCP

BigDataCloud client IP and reverse geocode APIs. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `client_ip`  Get caller IP details.
* `reverse_geocode`  Reverse geocode coordinates to a location.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Bigdatacloud API.


