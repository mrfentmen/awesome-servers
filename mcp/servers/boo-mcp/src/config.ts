import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "boo",
  "displayName": "Boo",
  "version": "1.0.0",
  "extensions": [
    ".boo"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "class",
      "pattern": "^\\s*class\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*def\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "interface",
      "pattern": "^\\s*interface\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "enum",
      "pattern": "^\\s*enum\\s+([A-Za-z_][A-Za-z0-9_]*)"
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
      "path": "src/demo.boo",
      "content": "def add(a as int, b as int) as int:\n    return a + b\n"
    },
    {
      "path": "tests/run.boo",
      "content": "def add(a as int, b as int) as int:\n    return a + b\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "def name(value as int) as int:\n    return value + 1"
    }
  },
  "reference": "Boo syntax reference\n- Function: def name(value as int) as int: return value + 1\n- Class: class Name: ...\n- Interface: interface Name: ...\n- Enum: enum Name: Value\n- Import: import System\n- Conditional: if condition: ...\n- Loop: for i in range(10): ...\n- Comment: # line; /* block */\n- Run: boo file.boo",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
