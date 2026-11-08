import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "quint",
  "displayName": "Quint",
  "version": "1.0.0",
  "extensions": [
    ".qnt"
  ],
  "markers": [],
  "comment": "//",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  },
  "stringQuotes": [
    "\"",
    "'"
  ],
  "symbols": [
    {
      "kind": "module",
      "pattern": "^\\s*module\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "definition",
      "pattern": "^\\s*(?:val|def|pure def|action)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "type",
      "pattern": "^\\s*type\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*var\\s+([A-Za-z_][A-Za-z0-9_]*)"
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
      "path": "src/demo.qnt",
      "content": "module Demo {\n  val add = 2 + 2\n}\n"
    },
    {
      "path": "tests/run.qnt",
      "content": "module Test {\n  val value = 2 + 2\n}\n"
    }
  ],
  "snippets": {
    "definition": {
      "description": "definition",
      "body": "val name = 1"
    },
    "action": {
      "description": "action",
      "body": "action next = value' = value + 1"
    },
    "module": {
      "description": "module",
      "body": "module Name {\n  val value = 1\n}"
    }
  },
  "reference": "Quint syntax reference\n- Module: module Name { ... }\n- Definition: val name = 1\n- Action: action next = value' = value + 1\n- Variable: var value: int\n- Type: type Name = int\n- Import: import module.*\n- Conditional: if (condition) value else other\n- Comment: // line; /* block */\n- Run: quint run file.qnt"
}
