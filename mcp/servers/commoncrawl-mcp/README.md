# commoncrawl-mcp

Discover historical web captures through the Common Crawl index. This server is for provenance research, archival discovery, broken-link investigations, and finding the capture metadata needed for a later archive fetch.

## Tools

- `list_indexes`: list recent crawl collections.
- `latest_index`: return the newest collection id.
- `search_captures`: search URL or wildcard patterns and return capture index metadata such as timestamp, status, digest, filename, offset, and length.

This server searches the index only. It does not download page contents, bypass access controls, or guarantee that a capture is complete or legally reusable. Requests and result pages are bounded.

## Run

```bash
npm install
npm run build
node dist/index.js
```
