# Star Wars MCP

Look up Star Wars people, planets, and starships from the public SWAPI mirror. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `people_info`  Person details by ID.
* `planet_info`  Planet details by ID.
* `search_people`  Search characters.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public SWAPI Tech mirror.


