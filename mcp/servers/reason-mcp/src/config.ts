import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "reason",
  "displayName": "Reason",
  "version": "1.0.0",
  "extensions": [
    ".re",
    ".rei"
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
      "path": "src/demo.re",
      "content": "let add = (a, b) => a + b;\n"
    },
    {
      "path": "tests/run.re",
      "content": "let add = (a, b) => a + b;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "let add = (a, b) => a + b;\n"
    }
  },
  "reference": "Reason syntax reference\n- Example: let add = (a, b) => a + b;",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
