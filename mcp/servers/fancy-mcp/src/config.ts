import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "fancy",
  "displayName": "Fancy",
  "version": "1.0.0",
  "extensions": [
    ".fy",
    ".fancypack"
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
      "path": "src/demo.fy",
      "content": "def add(a, b) {\n  a + b\n}\n"
    },
    {
      "path": "tests/run.fy",
      "content": "def add(a, b) {\n  a + b\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "def add(a, b) {\n  a + b\n}\n"
    }
  },
  "reference": "Fancy syntax reference\n- Example: def add(a, b) {\n- Comment: #\n- Run: fancy {file}"
}
