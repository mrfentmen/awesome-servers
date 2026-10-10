# Name Age MCP

Estimate the typical age and gender for a first name from the public Agify and Genderize APIs. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `estimate_age`  Estimated age for a name.
* `estimate_gender`  Estimated gender for a name.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Estimates come from public datasets and are honest about being statistical averages.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `famous_namesakes`
* `namesake_lifespan`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
