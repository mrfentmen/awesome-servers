# HTTP Inspector MCP

Fetch a URL and report its status code, headers, content type, and size. Runs locally. Useful for debugging web services.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `inspect_url`  Inspect a URL.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Response bodies are never returned, only headers and sizes, so no content is leaked.


