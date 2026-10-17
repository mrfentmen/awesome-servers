# Patents MCP

Search US patents and applications through the public Google Patents search endpoint. No API key is required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search_patents`  Patent search with titles, abstracts, and assignees.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Results come from the public Google Patents search service. Responses are bounded.


