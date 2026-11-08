import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "e",
  "displayName": "E",
  "version": "1.0.0",
  "extensions": [
    ".e"
  ],
  "markers": [],
  "comment": "#",
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
      "path": "src/demo.e",
      "content": "def add(a, b) {\n  return a + b\n}\n"
    },
    {
      "path": "tests/run.e",
      "content": "def add(a, b) {\n  return a + b\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "def add(a, b) {\n  return a + b\n}\n"
    }
  },
  "reference": "E syntax reference\n- Example: def add(a, b) {\n- Comment: #\n- No CLI runner configured"
}
