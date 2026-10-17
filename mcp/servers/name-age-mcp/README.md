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


