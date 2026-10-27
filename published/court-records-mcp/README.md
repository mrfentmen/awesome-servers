# Court Records MCP

Search published US court opinions through the public CourtListener search feed. No API key is required for search.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search_cases`  Full text search over court opinions.
* `get_case`  Fetch one opinion by id.

* `search_dockets`
* `list_courts`
* `search_judges`
## Usage

```bash
npm install
npm run build
node dist/index.js
```

CourtListener is a free public archive of US case law run by Free Law Project. Search works with no key. Full opinion text uses the CourtListener REST API, which needs a free token set as COURT_LISTENER_API_TOKEN.
