import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "jq",
  "displayName": "jq",
  "version": "1.0.0",
  "extensions": [
    ".jq"
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
      "path": "src/demo.jq",
      "content": "def add($x): $x + 1;\nadd(2)\n"
    },
    {
      "path": "tests/run.jq",
      "content": "def add($x): $x + 1;\nadd(2)\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "def add($x): $x + 1;\nadd(2)\n"
    }
  },
  "reference": "jq syntax reference\n- Example: def add($x): $x + 1;"
}
