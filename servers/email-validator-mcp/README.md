# Email Validator MCP

Validate email addresses without sending mail. Checks the format, looks up the MX record, and flags disposable domains. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `validate_email`  Validate a single email address.
* `validate_batch`  Validate multiple addresses.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

MX records are resolved through the DNS of the sending machine. A missing MX record does not guarantee an inbox does not exist, the result is honest about that.
