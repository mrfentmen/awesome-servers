# Overpass MCP

Query OpenStreetMap features like cafes, schools, and parks through the public Overpass API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `nodes_in_box`  Features of a type inside a box.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Results come from live OpenStreetMap data. Overpass has a shared quota, so the server reports honest errors when it is busy.


