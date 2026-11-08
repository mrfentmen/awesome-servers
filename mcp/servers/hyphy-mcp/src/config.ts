import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "hyphy",
  "displayName": "HyPhy",
  "version": "1.0.0",
  "extensions": [
    ".bf"
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
      "path": "src/demo.bf",
      "content": "function add(a, b) {\n  return a + b;\n}\n"
    },
    {
      "path": "tests/run.bf",
      "content": "function add(a, b) {\n  return a + b;\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function add(a, b) {\n  return a + b;\n}\n"
    }
  },
  "reference": "HyPhy syntax reference\n- Example: function add(a, b) {\n- Comment: //\n- Run: hyphy {file}",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
