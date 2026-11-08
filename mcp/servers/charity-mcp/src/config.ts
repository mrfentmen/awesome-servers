import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "charity",
  "displayName": "Charity",
  "version": "1.0.0",
  "extensions": [
    ".ch"
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
      "path": "src/demo.ch",
      "content": "def add(a: int, b: int): int = a + b\n"
    },
    {
      "path": "tests/run.ch",
      "content": "def add(a: int, b: int): int = a + b\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "def add(a: int, b: int): int = a + b\n"
    }
  },
  "reference": "Charity syntax reference\n- Example: def add(a: int, b: int): int = a + b\n- Comment: //\n- No CLI runner configured",
  "blockComment": {
    "start": "(*",
    "end": "*)"
  }
}
