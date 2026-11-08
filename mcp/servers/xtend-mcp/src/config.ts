import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "xtend",
  "displayName": "Xtend",
  "version": "1.0.0",
  "extensions": [
    ".xtend"
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
      "path": "src/demo.xtend",
      "content": "class Demo {\n  def add(int a, int b) { a + b }\n}\n"
    },
    {
      "path": "tests/run.xtend",
      "content": "class Demo {\n  def add(int a, int b) { a + b }\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "class Name {\n  def value() { 1 }\n}"
    }
  },
  "reference": "Xtend syntax reference\n- Class: class Name { ... }\n- Function: def value() { 1 }\n- Interface: interface Name { ... }\n- Import: import java.util.List\n- Variable: val value = 1\n- Conditional: if (condition) { ... }\n- Loop: for (value : values) { ... }\n- Comment: // line; /* block */\n- Run: xtend file.xtend",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
