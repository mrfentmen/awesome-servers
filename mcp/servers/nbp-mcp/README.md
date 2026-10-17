# Nbp MCP

Polish National Bank data: FX tables, single currency rates, and gold prices. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools

* `table`  Full NBP FX table A, B, or C.
* `rates`  One currency rate from NBP.
* `gold`  NBP gold price per gram.

## Usage

```bash
npm install
npm run build
node dist/index.js
```


