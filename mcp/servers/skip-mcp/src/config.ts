import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "skip",
  "displayName": "Skip",
  "version": "1.0.0",
  "extensions": [
    ".skip"
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
      "path": "src/demo.skip",
      "content": "fun add(a: Int, b: Int): Int { a + b }\n"
    },
    {
      "path": "tests/run.skip",
      "content": "fun add(a: Int, b: Int): Int { a + b }\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "fun add(a: Int, b: Int): Int { a + b }\n"
    }
  },
  "reference": "Skip syntax reference\n- Example: fun add(a: Int, b: Int): Int { a + b }"
}
