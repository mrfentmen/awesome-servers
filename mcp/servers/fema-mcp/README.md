# FEMA MCP

Federal disaster declarations from the public FEMA open data API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `declarations`  Disaster declarations for a state.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public FEMA open data API.


