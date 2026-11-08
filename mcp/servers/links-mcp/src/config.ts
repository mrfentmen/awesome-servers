import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "links",
  "displayName": "Links",
  "version": "1.0.0",
  "extensions": [
    ".links"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*fun\\s+([a-z][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.links",
      "content": "fun add(a, b) { a + b }\n"
    },
    {
      "path": "tests/run.links",
      "content": "fun add(a, b) { a + b }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "fun add(a, b) { a + b }\n"
    }
  },
  "reference": "Links syntax reference\n- Example: fun add(a, b) { a + b }"
}
