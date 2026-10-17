# Lorem MCP

Generate lorem ipsum and filler text locally. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `generate`  Lorem ipsum paragraphs.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Text is generated locally from a fixed word set with seeded randomness.


