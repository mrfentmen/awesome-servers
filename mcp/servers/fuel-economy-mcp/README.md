# Fuel Economy MCP

Vehicle fuel economy ratings from the EPA public database. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `vehicle_mpg`  MPG for a vehicle.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Ratings come from the public EPA fueleconomy service.


