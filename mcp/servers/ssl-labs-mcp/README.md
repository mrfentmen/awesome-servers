# SSL Labs MCP

TLS security grades from the public SSL Labs API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `analyze`  Grade a host.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public SSL Labs API.


