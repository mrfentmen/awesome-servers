import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "clue",
  "displayName": "Clue",
  "version": "1.0.0",
  "extensions": [
    ".clue"
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
      "path": "src/demo.clue",
      "content": "def add(a, b) {\n  return a + b\n}\n"
    },
    {
      "path": "tests/run.clue",
      "content": "def add(a, b) {\n  return a + b\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "def add(a, b) {\n  return a + b\n}\n"
    }
  },
  "reference": "Clue syntax reference\n- Example: def add(a, b) {\n- Comment: //\n- No CLI runner configured"
}
