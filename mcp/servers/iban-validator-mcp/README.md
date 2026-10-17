# IBAN Validator MCP

Validate and format IBAN bank account numbers on the local machine. No network, no key, nothing is sent anywhere.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `validate`  Check IBAN validity.
* `info`  IBAN country and structure.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Validation follows the official IBAN checksum and format rules. The number is processed entirely locally.


