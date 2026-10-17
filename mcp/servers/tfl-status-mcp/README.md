# TfL Status MCP

London transport line status from the public Transport for London API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `status`  Line status.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Transport for London API.


