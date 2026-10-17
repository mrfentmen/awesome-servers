# VATComply MCP

VAT rates from the public VATComply API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `rates`  Current VAT rates.
* `country`  VAT for a country.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public VATComply API.


