import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "x10",
  "displayName": "X10",
  "version": "1.0.0",
  "extensions": [
    ".x10"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "class",
      "pattern": "^\\s*(?:class|interface|struct)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*(?:static\\s+)?def\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*val\\s+([A-Za-z_][A-Za-z0-9_]*)"
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
      "path": "src/demo.x10",
      "content": "class Demo {\n  static def add(a: Long, b: Long): Long = a + b;\n}\n"
    },
    {
      "path": "tests/run.x10",
      "content": "class Demo {\n  static def add(a: Long, b: Long): Long = a + b;\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "class Name {\n  static def value(): Long = 1;\n}"
    }
  },
  "reference": "X10 syntax reference\n- Class: class Name { ... }\n- Function: static def value(): Long = 1;\n- Interface: interface Name { ... }\n- Import: import x10.util.*\n- Value: val value = 1;\n- Conditional: if (condition) { ... }\n- Loop: for (i in 0..10) { ... }\n- Comment: // line; /* block */\n- Run: x10c file.x10",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
