# VIN Decoder MCP

Decode a vehicle identification number into make, model, year, and more. Uses the public NHTSA decoder. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `decode_vin`  Decode a VIN.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Decoding uses the public NHTSA VPIC service. Missing values mean NHTSA has no data for that variable.


