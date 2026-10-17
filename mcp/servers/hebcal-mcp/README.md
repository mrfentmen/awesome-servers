# Hebcal MCP

Hebrew calendar conversion from the public Hebcal API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `convert`  Convert a Gregorian date.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Hebcal API.


