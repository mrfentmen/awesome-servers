import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "fantom",
  "displayName": "Fantom",
  "version": "1.0.0",
  "extensions": [
    ".fan"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "class",
      "pattern": "^\\s*(?:class|mixin|enum)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "method",
      "pattern": "^\\s*(?:static\\s+)?[A-Z][A-Za-z0-9_?]*\\s+([a-z][A-Za-z0-9_]*)\\s*\\([^)]*\\)\\s*\\{"
    }
  ],
  "imports": [
    {
      "kind": "using",
      "pattern": "^\\s*using\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.fan",
      "content": "class Main {\n  static Int add(Int a, Int b) { a + b }\n}\n"
    },
    {
      "path": "tests/run.fan",
      "content": "class Main {\n  static Int add(Int a, Int b) { a + b }\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "class Name {\n  static Int value() { 1 }\n}"
    }
  },
  "reference": "Fantom syntax reference\n- Class: class Name { ... }\n- Method: static Int value() { 1 }\n- Mixin: mixin Name { ... }\n- Enum: enum Name { Value }\n- Using: using sys\n- Field: Int value := 1\n- Comment: // line; /* block */\n- Run: fan file.fan",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
