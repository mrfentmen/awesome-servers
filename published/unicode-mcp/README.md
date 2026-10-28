# unicode-mcp

A practical Unicode reference for agents working with internationalization, text processing, emoji, fonts, and character bugs.

## Tools

- `get_character`: inspect official UnicodeData fields for a code point.
- `search_blocks`: search Unicode block names and ranges.
- `search_emoji`: search the official emoji test data by name or annotation.

The server reads official Unicode data files and caches them only for the current process. Unicode normalization, rendering, grapheme segmentation, and font support are separate concerns and are not inferred by this server.

## Run

```bash
npm install
npm run build
node dist/index.js
```
