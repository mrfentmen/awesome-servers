# EPA FRS MCP

Facilities and addresses from the public EPA Facility Registry Service. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `by_state`  Facilities in a state.
* `facility`  One facility by ID.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public EPA Facility Registry Service. Environmental compliance data sells commercially.


