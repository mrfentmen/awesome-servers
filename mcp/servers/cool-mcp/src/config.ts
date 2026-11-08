import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "cool",
  "displayName": "Cool",
  "version": "1.0.0",
  "extensions": [
    ".cl"
  ],
  "markers": [],
  "comment": "--",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "class",
      "pattern": "^\\s*class\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "method",
      "pattern": "^\\s*([a-z][A-Za-z0-9_]*)\\s*\\([^)]*\\)\\s*:\\s*[A-Za-z_][A-Za-z0-9_]*\\s*\\{"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.cl",
      "content": "class Main {\n    add(a: Int, b: Int): Int { a + b };\n};\n"
    },
    {
      "path": "tests/run.cl",
      "content": "class Main {\n    add(a: Int, b: Int): Int { a + b };\n};\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "class Name {\n    value(): Int { 1 };\n};"
    }
  },
  "reference": "Cool syntax reference\n- Class: class Name { ... };\n- Method: value(): Int { 1 };\n- Attribute: value: Int <- 1;\n- Inherits: class Name inherits Base { ... };\n- Conditional: if condition then expression else expression fi\n- Loop: while condition loop expression pool\n- Comment: -- line; (* block *)\n- Run: cool file.cl",
  "blockComment": {
    "start": "(*",
    "end": "*)"
  }
}
