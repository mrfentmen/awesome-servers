# PokéAPI MCP

Look up Pokemon species, abilities, types, and stats from the public PokéAPI. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `pokemon_info`  Details for a Pokemon.
* `search_pokemon`  Search Pokemon by name.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public PokéAPI.


