# GitHub Status MCP

GitHub service status from the public GitHub Status API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `status`  Current status.
* `incidents`  Recent incidents.

* `components`
* `maintenances`
* `incident_details`
## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public GitHub Status API.
