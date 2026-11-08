import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "ergoscript",
  "displayName": "ErgoScript",
  "version": "1.0.0",
  "extensions": [
    ".es"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "variable",
      "pattern": "^\\s*val\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*def\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.es",
      "content": "{\n  val add = {(a: Int, b: Int) => a + b}\n  add(1, 2)\n}\n"
    },
    {
      "path": "tests/run.es",
      "content": "{\n  val add = {(a: Int, b: Int) => a + b}\n  add(1, 2)\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "{\n  val value = {(a: Int) => a + 1}\n  value(1)\n}"
    }
  },
  "reference": "ErgoScript syntax reference\n- Value: val value = {(a: Int) => a + 1}\n- Function: def value(a: Int): Int = a + 1\n- Import: import sigma.Coll\n- Block: { ... }\n- Conditional: if (condition) ... else ...\n- Comment: // line; /* block */\n- Compile: ergo file.es",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
