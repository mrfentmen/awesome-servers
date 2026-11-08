import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "ink",
  "displayName": "Ink",
  "version": "1.0.0",
  "extensions": [
    ".ink"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "knot",
      "pattern": "^===\\s*([A-Za-z_]\\w*)\\s*==="
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.ink",
      "content": "=== start ===\nHello world.\n-> END\n"
    },
    {
      "path": "tests/run.ink",
      "content": "=== start ===\nHello world.\n-> END\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "=== start ===\nHello world.\n-> END\n"
    }
  },
  "reference": "Ink syntax reference\n- Example: === start ===\n- Comment: //\n- Run: inklecate {file}",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
