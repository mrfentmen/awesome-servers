# Deck of Cards MCP

Shuffle decks and draw cards from the public Deck of Cards API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `new_deck`  Create and shuffle a deck.
* `draw`  Draw cards.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Deck of Cards API.


