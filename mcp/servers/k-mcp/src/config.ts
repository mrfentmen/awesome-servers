import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "k",
  "displayName": "K",
  "version": "1.0.0",
  "extensions": [
    ".k"
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
      "path": "src/demo.k",
      "content": "add:{x+y}\n"
    },
    {
      "path": "tests/run.k",
      "content": "add:{x+y}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "value:{x+1}"
    }
  },
  "reference": "K syntax reference\n- Function: value:{x+1}\n- Variable: value:1\n- Load: \\l file.k\n- Vector: 1 2 3\n- Apply: value[1]\n- Comment: / line\n- Run: k file.k"
}
