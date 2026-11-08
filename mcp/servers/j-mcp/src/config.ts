import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "j",
  "displayName": "J",
  "version": "1.0.0",
  "extensions": [
    ".ijs"
  ],
  "markers": [],
  "comment": "NB.",
  "stringQuotes": [
    "'"
  ],
  "symbols": [
    {
      "kind": "verb",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*=:\\s*(?:verb|dyad|monad)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*=:"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*=\\s*"
    }
  ],
  "imports": [
    {
      "kind": "load",
      "pattern": "^\\s*load\\s+['\"]([^'\"]+)"
    },
    {
      "kind": "require",
      "pattern": "^\\s*require\\s+['\"]([^'\"]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.ijs",
      "content": "add =: +\n2 add 2\n"
    },
    {
      "path": "tests/run.ijs",
      "content": "assert =: 3 : 'if. y do. 1 else. 0 end.'\nassert 2+2=4\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "verb",
      "body": "name =: +"
    },
    "explicit": {
      "description": "explicit verb",
      "body": "name =: 3 : 'y + 1'"
    },
    "variable": {
      "description": "variable",
      "body": "name =: 1"
    }
  },
  "reference": "J syntax reference\n- Verb: name =: +\n- Explicit verb: name =: 3 : 'y + 1'\n- Variable: name =: 1\n- Add: 1 + 2\n- Reduce: +/ 1 2 3\n- Each: +: each 1 2 3\n- Load: load 'file.ijs'\n- Comment: NB. line\n- Run: jconsole file.ijs"
}
