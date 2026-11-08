import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "bosque",
  "displayName": "Bosque",
  "version": "1.0.0",
  "extensions": [
    ".bsq"
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
      "path": "src/demo.bsq",
      "content": "function add(a: Int, b: Int): Int {\n  return a + b;\n}\n"
    },
    {
      "path": "tests/run.bsq",
      "content": "function add(a: Int, b: Int): Int {\n  return a + b;\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function add(a: Int, b: Int): Int {\n  return a + b;\n}\n"
    }
  },
  "reference": "Bosque syntax reference\n- Example: function add(a: Int, b: Int): Int {"
}
