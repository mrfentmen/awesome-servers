# Number Tools MCP

Convert numbers between bases, make roman numerals, and spell out numbers locally. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `convert_base`  Convert between bases.
* `roman`  Convert to and from roman numerals.
* `spell_number`  Spell a number in words.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

All processing happens locally.


