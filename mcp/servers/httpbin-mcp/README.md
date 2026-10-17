# HTTPBin MCP

HTTP request testing from the public HTTPBin API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `get`  GET echo.
* `ip`  Outbound IP.
* `headers`  Headers echo.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public HTTPBin API.


