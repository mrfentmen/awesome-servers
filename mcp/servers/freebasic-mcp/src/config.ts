import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "freebasic",
  "displayName": "FreeBASIC",
  "version": "1.0.0",
  "extensions": [
    ".bas",
    ".bi"
  ],
  "markers": [],
  "comment": "'",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.bas",
      "content": "function add(a as integer, b as integer) as integer\n  return a + b\nend function\n"
    },
    {
      "path": "tests/run.bas",
      "content": "function add(a as integer, b as integer) as integer\n  return a + b\nend function\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function add(a as integer, b as integer) as integer\n  return a + b\nend function\n"
    }
  },
  "reference": "FreeBASIC syntax reference\n- Example: function add(a as integer, b as integer) as integer\n- Comment: '\n- Run: fbc {file}"
}
