import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "mill",
  "displayName": "Mill",
  "version": "1.0.0",
  "extensions": [
    ".sc"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*def\\s+([a-z][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.sc",
      "content": "def add(a: Int, b: Int) = a + b\n"
    },
    {
      "path": "tests/run.sc",
      "content": "def add(a: Int, b: Int) = a + b\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "def add(a: Int, b: Int) = a + b\n"
    }
  },
  "reference": "Mill syntax reference\n- Example: def add(a: Int, b: Int) = a + b"
}
