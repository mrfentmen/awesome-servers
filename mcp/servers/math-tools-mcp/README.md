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


