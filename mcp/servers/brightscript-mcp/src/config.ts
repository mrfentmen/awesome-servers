import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "brightscript",
  "displayName": "BrightScript",
  "version": "1.0.0",
  "extensions": [
    ".brs"
  ],
  "markers": [],
  "comment": "'",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.brs",
      "content": "function add(a as integer, b as integer) as integer\n  return a + b\nend function\n"
    },
    {
      "path": "tests/run.brs",
      "content": "function add(a as integer, b as integer) as integer\n  return a + b\nend function\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function add(a as integer, b as integer) as integer\n  return a + b\nend function\n"
    }
  },
  "reference": "BrightScript syntax reference\n- Example: function add(a as integer, b as integer) as integer\n- Comment: '\n- Run: bsc {file}"
}
