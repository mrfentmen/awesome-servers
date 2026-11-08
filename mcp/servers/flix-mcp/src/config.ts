import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "flix",
  "displayName": "Flix",
  "version": "1.0.0",
  "extensions": [
    ".flix"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*def\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "enum",
      "pattern": "^\\s*enum\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "trait",
      "pattern": "^\\s*trait\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "class",
      "pattern": "^\\s*class\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "use",
      "pattern": "^\\s*use\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.flix",
      "content": "def add(a: Int32, b: Int32): Int32 = a + b\n"
    },
    {
      "path": "tests/run.flix",
      "content": "def add(a: Int32, b: Int32): Int32 = a + b\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "def name(value: Int32): Int32 = value + 1"
    }
  },
  "reference": "Flix syntax reference\n- Function: def name(value: Int32): Int32 = value + 1\n- Enum: enum Name { case Value }\n- Trait: trait Name { ... }\n- Class: class Name { ... }\n- Use: use List.map\n- Let: let value = 1;\n- Comment: // line; /* block */\n- Run: flix file.flix",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
