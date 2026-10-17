# Phone Validator MCP

Validate and format international phone numbers on the local machine with the libphonenumber library. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `validate`  Validate a phone number.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Formatting follows the international E.164 standard. The number is processed entirely locally.


