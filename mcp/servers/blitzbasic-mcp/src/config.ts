import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "blitzbasic",
  "displayName": "BlitzBasic",
  "version": "1.0.0",
  "extensions": [
    ".bb",
    ".decls"
  ],
  "markers": [],
  "comment": "'",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*Function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.bb",
      "content": "Function Add(a, b)\n  Return a + b\nEnd Function\n"
    },
    {
      "path": "tests/run.bb",
      "content": "Function Add(a, b)\n  Return a + b\nEnd Function\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "Function Add(a, b)\n  Return a + b\nEnd Function\n"
    }
  },
  "reference": "BlitzBasic syntax reference\n- Example: Function Add(a, b)\n- Comment: '\n- No CLI runner configured"
}
