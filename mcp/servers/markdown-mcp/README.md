# Markdown MCP

Convert markdown to HTML and extract heading outlines locally. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `to_html`  Markdown to HTML.
* `headings`  Heading outline.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Conversion runs locally with the marked library.


