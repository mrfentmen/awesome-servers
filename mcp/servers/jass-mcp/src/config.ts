import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "jass",
  "displayName": "JASS",
  "version": "1.0.0",
  "extensions": [
    ".j"
  ],
  "markers": [],
  "comment": "//",
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
      "path": "src/demo.j",
      "content": "function add takes integer a, integer b returns integer\n  return a + b\nendfunction\n"
    },
    {
      "path": "tests/run.j",
      "content": "function add takes integer a, integer b returns integer\n  return a + b\nendfunction\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function add takes integer a, integer b returns integer\n  return a + b\nendfunction\n"
    }
  },
  "reference": "JASS syntax reference\n- Example: function add takes integer a, integer b returns integer\n- Comment: //\n- No CLI runner configured",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
