# PubChem MCP

Look up chemical compound properties and synonyms from the public PubChem REST API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `compound`  Properties for a compound.
* `search`  Search compound names.

* `cid_lookup`
* `formula_search`
* `synonyms`
* `similar`
* `substructure`
* `assay_summary`
## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public PubChem API maintained by the National Institutes of Health.
