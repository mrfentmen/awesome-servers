# mitre-attack-mcp

Search the MITRE ATT&CK enterprise knowledge base for adversary techniques, tactics, and mitigations. The STIX bundle is cached locally with a TTL so repeated calls are fast.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search`  Search techniques by keyword.
* `technique`  Get one technique by ID.

## Usage

```bash
npm install
npm run build
node dist/index.js
```


