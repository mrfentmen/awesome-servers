# UniProt MCP

Protein sequences, names, and functions from the public UniProt API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `accession`  Details for an accession.
* `search`  Search proteins.

* `proteome`
* `idmap_run`
* `idmap_status`
* `idmap_result`
* `taxonomy`
## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public UniProt API. Commercial bioinformatics databases charge for this.
