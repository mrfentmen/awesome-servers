import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "jte",
  "displayName": "Java Template Engine",
  "version": "1.0.0",
  "extensions": [
    ".jte"
  ],
  "markers": [],
  "comment": "{!",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "parameter",
      "pattern": "@param\\s+\\w+\\s+([A-Za-z_]\\w*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.jte",
      "content": "@param int a\n@param int b\n<p>${a + b}</p>\n"
    },
    {
      "path": "tests/run.jte",
      "content": "@param int a\n@param int b\n<p>${a + b}</p>\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "@param int a\n@param int b\n<p>${a + b}</p>\n"
    }
  },
  "reference": "Java Template Engine syntax reference\n- Example: @param int a\n- Comment: {!\n- No CLI runner configured",
  "blockComment": {
    "start": "{!",
    "end": "!}"
  }
}
