# Diff MCP

Compare two texts and show line changes locally. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `diff_text`  Simple diff.
* `unified_diff`  Unified diff with context.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Diffing runs locally with the diff library.


