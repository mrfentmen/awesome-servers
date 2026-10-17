# RxNav MCP

Drug names, identifiers, and properties from the public NIH RxNav API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search`  Find drug candidates.
* `properties`  Properties for an identifier.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public NIH RxNav API, the official US drug terminology source.


