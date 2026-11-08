import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "daslang",
  "displayName": "Daslang",
  "version": "1.0.0",
  "extensions": [
    ".das"
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
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.das",
      "content": "def add(a: int, b: int): int {\n  return a + b\n}\n"
    },
    {
      "path": "tests/run.das",
      "content": "def add(a: int, b: int): int {\n  return a + b\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "def add(a: int, b: int): int {\n  return a + b\n}\n"
    }
  },
  "reference": "Daslang syntax reference\n- Example: def add(a: int, b: int): int {\n- Comment: //\n- Run: daslang {file}",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
