import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "grain",
  "displayName": "Grain",
  "version": "1.0.0",
  "extensions": [
    ".gr"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*let\\s+([a-z][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.gr",
      "content": "let add = (a: Int, b: Int) => a + b\n"
    },
    {
      "path": "tests/run.gr",
      "content": "let add = (a: Int, b: Int) => a + b\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "let add = (a: Int, b: Int) => a + b\n"
    }
  },
  "reference": "Grain syntax reference\n- Example: let add = (a: Int, b: Int) => a + b"
}
