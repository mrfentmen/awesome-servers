# Google Autocomplete MCP

Google search suggestions from the public suggest endpoint. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `suggest`  Suggestions.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Google suggest endpoint.


