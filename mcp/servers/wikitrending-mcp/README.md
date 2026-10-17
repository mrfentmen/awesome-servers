# Wikipedia Trending MCP

Wikipedia featured content from the public Wikimedia featured feed. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `featured`  Featured article for a date.
* `mostread`  Most-read articles.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Wikimedia featured feed.


