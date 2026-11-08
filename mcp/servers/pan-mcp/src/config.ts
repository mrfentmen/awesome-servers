import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "pan",
  "displayName": "Pan",
  "version": "1.0.0",
  "extensions": [
    ".pan"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "class",
      "pattern": "^\\s*(?:class|interface|enum)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "method",
      "pattern": "^\\s*([a-z][A-Za-z0-9_]*)\\s*\\([^)]*\\)\\s*:\\s*[A-Za-z_][A-Za-z0-9_]*\\s*\\{"
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
      "path": "src/demo.pan",
      "content": "class Demo {\n  add(a: Int, b: Int): Int { a + b }\n}\n"
    },
    {
      "path": "tests/run.pan",
      "content": "class Demo {\n  add(a: Int, b: Int): Int { a + b }\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "class Name {\n  value(): Int { 1 }\n}"
    }
  },
  "reference": "Pan syntax reference\n- Class: class Name { ... }\n- Method: value(): Int { 1 }\n- Interface: interface Name { ... }\n- Import: import system\n- Variable: value: Int = 1\n- Conditional: if (condition) { ... }\n- Loop: while (condition) { ... }\n- Comment: // line; /* block */\n- Run: pan file.pan",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
