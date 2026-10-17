# Anagram MCP

Check and generate anagrams locally. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `check_anagram`  Check two words.
* `anagrams_of`  Generate rearrangements.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Generation runs locally and is bounded to avoid huge outputs.


