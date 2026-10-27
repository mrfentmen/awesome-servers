# arXiv MCP

Search academic papers on arXiv by keyword, author, or title. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search_papers`  Search arXiv papers.
* `paper_info`  Details for a paper by ID.

* `search_title`
* `search_author`
* `search_category`
* `newest_papers`
* `papers_by_id`
## Usage

```bash
npm install
npm run build
node dist/index.js
```

Paper metadata comes from the public arXiv API.
