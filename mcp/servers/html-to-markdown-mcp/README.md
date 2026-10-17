# HTML to Markdown MCP

Convert HTML into clean markdown locally. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `convert`  HTML to markdown.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Conversion runs locally with the turndown library.


