# Terraform Registry MCP

Terraform providers and modules from the public Terraform registry. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `provider`  Provider details.
* `module`  Module details.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Terraform registry API.


