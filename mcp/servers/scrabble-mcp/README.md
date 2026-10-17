# Scrabble MCP

Score words using official Scrabble letter values on the local machine. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `word_score`  Score a word.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Letter values follow the standard English Scrabble distribution. Blank tiles are not scored.


