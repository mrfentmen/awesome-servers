# Poetry MCP

Search poems by title, author, or lines from the public PoetryDB. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search_titles`  Poems matching a title.
* `by_author`  Poems by an author.
* `random_poem`  A random poem.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Poem texts come from the public PoetryDB API.


