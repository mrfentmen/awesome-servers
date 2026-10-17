# Wiktionary MCP

Look up word definitions and etymology from the public Wiktionary API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `define`  Definition of a word.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Definitions come from the public Wiktionary API.


