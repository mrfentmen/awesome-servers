import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "q",
  "displayName": "Q",
  "version": "1.0.0",
  "extensions": [
    ".q"
  ],
  "markers": [],
  "comment": "/",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*:\\s*\\{"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*:"
    }
  ],
  "imports": [
    {
      "kind": "load",
      "pattern": "^\\s*\\\\l\\s+([A-Za-z_][A-Za-z0-9_./]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.q",
      "content": "add:{x+y}\n"
    },
    {
      "path": "tests/run.q",
      "content": "add:{x+y}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "value:{x+1}"
    }
  },
  "reference": "Q syntax reference\n- Function: value:{x+1}\n- Variable: value:1\n- Load: \\l file.q\n- List: 1 2 3\n- Table: ([] a:1 2; b:3 4)\n- Comment: / line\n- Run: q file.q"
}
