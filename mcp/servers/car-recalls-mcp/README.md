# Car Recalls MCP

Vehicle safety recalls from the NHTSA database by make, model, and year. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `recalls_by_vehicle`  Recalls for a vehicle.
* `recall_by_campaign`  Recall by campaign number.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Recall data comes from the public NHTSA API.


