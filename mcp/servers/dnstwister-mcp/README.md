# Dnstwister MCP

DNS twister domain threat intelligence: fuzz domains for typosquatting, check whois. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `fuzz`  Fuzz a domain for lookalike domains.
* `whois`  Get whois data for a domain.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Dnstwister API.


