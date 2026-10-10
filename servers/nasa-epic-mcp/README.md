# NASA EPIC MCP

Earth photos from the NASA EPIC camera on the DSCOVR satellite. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `latest`  Latest Earth images.
* `date`  Images for a date.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public NASA EPIC API. Earth imagery from space is rarely free.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `enhanced_latest`
* `enhanced_date`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
