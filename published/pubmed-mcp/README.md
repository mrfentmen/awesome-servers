# PubMed MCP

Search PubMed biomedical literature and fetch article summaries from the public NCBI API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search`  Search PubMed.
* `article`  One article summary.

* `abstract`
* `medline`
* `cited_by`
* `spellcheck`
* `db_info`
* `mesh_search`
## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public NCBI E-utilities API. PubMed is the largest free biomedical literature index.
