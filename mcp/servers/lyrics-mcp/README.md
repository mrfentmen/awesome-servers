# Lyrics MCP

Song lyrics by artist and title from the public lyrics service. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `get_lyrics`  Lyrics for a song.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Lyrics come from the public lyrics API and are only as complete as that source.


