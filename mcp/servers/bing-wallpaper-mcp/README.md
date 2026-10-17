# Bing Wallpaper MCP

The daily Bing wallpaper image and its metadata from the public Bing feed. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `today`  Today wallpaper.
* `recent`  Recent wallpapers.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Images come from the public Bing image archive feed.


