# GDELT MCP

Search the GDELT global news archive, a free index of billions of articles. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search_news`  Search news articles by keyword.
* `news_by_country`  Search news mentioning a place.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

GDELT limits requests to one every 5 seconds. The server paces requests automatically to stay within the limit.


