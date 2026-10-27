# Crossref MCP

Search scholarly works and resolve DOIs through the public Crossref API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search_works`  Search works.
* `doi_lookup`  Metadata for a DOI.

* `journals`
* `journal_lookup`
* `funders`
* `funder_lookup`
* `members`
* `member_lookup`
* `work_types`
* `licenses`
## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Crossref API.
