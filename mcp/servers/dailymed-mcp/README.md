# DailyMed MCP

FDA drug label information from the public DailyMed API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search`  Search drug labels.
* `spl`  One label by set ID.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public DailyMed API, the official FDA label source.


