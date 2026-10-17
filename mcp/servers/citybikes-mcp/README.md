# CityBikes MCP

List bike share networks and read live station availability from the public CityBikes API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `networks`  All networks.
* `network`  Live stations for one network.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public CityBikes aggregation API.


