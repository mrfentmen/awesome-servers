# Electricity Map MCP

Electricity zones from the public Electricity Map API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `zones`  List electricity zones.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Electricity Map API.


