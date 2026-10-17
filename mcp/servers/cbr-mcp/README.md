# CBR MCP

Russian central bank daily exchange rates from the public CBR API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `rates`  Daily exchange rates.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public CBR API.


