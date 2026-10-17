# Codeberg MCP

Codeberg repository data from the public Codeberg API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search`  Search repositories.
* `version`  Server version.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Codeberg API.


