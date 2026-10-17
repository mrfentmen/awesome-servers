# Deps.dev MCP

Open source dependency metadata from the public Google deps.dev API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `info`  Data for one package.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public deps.dev API.


