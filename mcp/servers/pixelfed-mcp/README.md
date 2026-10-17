# Pixelfed MCP

Pixelfed instance API: instance info and public timelines. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `instance`  Get Pixelfed instance info.
* `public_timeline`  Get public posts.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Pixelfed API.


