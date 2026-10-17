# Lemmy MCP

Lemmy community data from the public Lemmy API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `communities`  List communities.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Lemmy API.


