# UUID MCP

Generate and validate UUIDs locally. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `generate_uuid`  One random UUID.
* `generate_many`  Several UUIDs.
* `validate_uuid`  Validate a UUID string.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Generation uses the crypto random source.


