# Semantic Scholar MCP

Search academic papers and read citation counts from the public Semantic Scholar API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search_papers`  Search papers.
* `paper_info`  Details and citations for a paper.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Semantic Scholar rate limits anonymous access. The server retries and reports an honest error when the limit is hit.


