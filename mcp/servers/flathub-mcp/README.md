# Flathub MCP

Search Linux apps on the public Flathub API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search`  Search apps.
* `app`  Details for one app.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Flathub API, the Linux app store.


