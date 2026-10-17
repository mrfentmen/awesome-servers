# Fear and Greed MCP

Read the crypto fear and greed index from the public alternative.me API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `current`  The current index value.
* `history`  Recent index values.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

The index is a sentiment measure from the public alternative.me API.


