# Tarot MCP

Draw tarot cards and read card meanings from the public Tarot API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `random_cards`  Draw random cards.
* `card_info`  Meaning of one card.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Card data comes from the public Tarot API.


