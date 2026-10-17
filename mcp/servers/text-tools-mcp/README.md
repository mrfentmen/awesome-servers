# Text Tools MCP

Slugify, convert case, and encode text on the local machine. No network, no key, nothing leaves the machine.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `slugify`  Make a URL slug.
* `to_case`  Convert text case.
* `base64`  Encode or decode base64.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

All processing happens locally.


