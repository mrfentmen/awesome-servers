# Postman Echo MCP

HTTP request echo from the public Postman Echo API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `get`  Echo a request.
* `ip`  Outbound IP.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Postman Echo API.


