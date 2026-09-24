# Workable MCP

Public job boards from the Workable API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `boards`  List boards.
* `jobs`  List jobs for a board.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Workable API.
