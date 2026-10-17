# Nextbus MCP

NextBus real-time public transit predictions (UmoIQ service). No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `agencies`  List transit agencies.
* `routes`  List routes for an agency.
* `predictions`  Get arrival predictions for a stop.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Nextbus API.


