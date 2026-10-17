# JSON Tools MCP

Validate, format, and inspect JSON on the local machine. No network, no key, nothing is sent anywhere.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `validate_json`  Check JSON validity.
* `format_json`  Pretty print JSON.
* `json_info`  Return top level type and key count.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

All processing happens locally. The server never sends your JSON anywhere.


