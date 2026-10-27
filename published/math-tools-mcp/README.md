# Math Tools MCP

Prime factors, GCD and LCM, and basic statistics computed on the local machine. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `prime_factors`  Prime factors.
* `gcd_lcm`  GCD and LCM.
* `stats`  Descriptive statistics.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

All computation happens locally. Values are bounded to keep results fast.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
