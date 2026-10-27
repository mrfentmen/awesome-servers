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

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
