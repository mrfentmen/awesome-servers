import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "berry",
  "displayName": "Berry",
  "version": "1.0.0",
  "extensions": [
    ".be"
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
      "path": "src/demo.be",
      "content": "def add(a, b)\n  return a + b\nend\n"
    },
    {
      "path": "tests/run.be",
      "content": "def add(a, b)\n  return a + b\nend\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "def add(a, b)\n  return a + b\nend\n"
    }
  },
  "reference": "Berry syntax reference\n- Example: def add(a, b)\n- Comment: #\n- Run: berry {file}"
}
