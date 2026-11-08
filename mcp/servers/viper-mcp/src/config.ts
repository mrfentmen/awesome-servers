import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "viper",
  "displayName": "Viper",
  "version": "1.0.0",
  "extensions": [
    ".vpr"
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
      "path": "src/demo.vpr",
      "content": "function add(a: Int, b: Int): Int {\n  a + b\n}\n"
    },
    {
      "path": "tests/run.vpr",
      "content": "function add(a: Int, b: Int): Int {\n  a + b\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function add(a: Int, b: Int): Int {\n  a + b\n}\n"
    }
  },
  "reference": "Viper syntax reference\n- Example: function add(a: Int, b: Int): Int {"
}
