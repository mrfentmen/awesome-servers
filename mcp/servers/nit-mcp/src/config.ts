import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "nit",
  "displayName": "Nit",
  "version": "1.0.0",
  "extensions": [
    ".nit"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*(?:redef\\s+)?fun\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "class",
      "pattern": "^\\s*(?:class|module|interface)\\s+([A-Za-z_][A-Za-z0-9_]*)"
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
      "path": "src/demo.nit",
      "content": "fun add(a: Int, b: Int): Int do return a + b\n"
    },
    {
      "path": "tests/run.nit",
      "content": "fun add(a: Int, b: Int): Int do return a + b\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "fun value(a: Int): Int do return a + 1"
    }
  },
  "reference": "Nit syntax reference\n- Function: fun value(a: Int): Int do return a + 1\n- Class: class Name ... end\n- Module: module name\n- Import: import module\n- Variable: var value: Int = 1\n- Conditional: if condition then ... end\n- Loop: for i in [1..10] do ... end\n- Comment: # line\n- Run: nit file.nit"
}
