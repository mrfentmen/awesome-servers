import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "imba",
  "displayName": "Imba",
  "version": "1.0.0",
  "extensions": [
    ".imba"
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
      "path": "src/demo.imba",
      "content": "def add a, b\n  a + b\n"
    },
    {
      "path": "tests/run.imba",
      "content": "def add a, b\n  a + b\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "def add a, b\n  a + b\n"
    }
  },
  "reference": "Imba syntax reference\n- Example: def add a, b\n- Comment: #\n- Run: imba {file}"
}
