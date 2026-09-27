# Wikipedia Pageviews MCP

Wikipedia page view statistics from the public Wikimedia API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `top`  Most viewed pages.

* `article_views`
* `project_aggregate`
* `top_by_access`
## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Wikimedia REST API.
