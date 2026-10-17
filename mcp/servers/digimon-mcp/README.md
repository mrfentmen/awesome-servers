# digimon-mcp

Digimon encyclopedia lookup from the free Digimon API. Returns name, level, and image for each partner.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search`  Search Digimon by name.
* `level`  List Digimon at a level.

## Usage

```bash
npm install
npm run build
node dist/index.js
```


