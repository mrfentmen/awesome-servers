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

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `decode_vin_full`
* `vehicle_recalls`
* `recall_campaign`
* `models_in_year`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
