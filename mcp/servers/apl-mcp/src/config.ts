import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "apl",
  "displayName": "APL",
  "version": "1.0.0",
  "extensions": [
    ".apl",
    ".dyalog"
  ],
  "markers": [],
  "comment": "⍝",
  "stringQuotes": [
    "'"
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*∇\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*←\\s*\\{"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*←"
    }
  ],
  "imports": [
    {
      "kind": "load",
      "pattern": "\\)load\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "fix",
      "pattern": "⎕FIX\\s+['\"]([^'\"]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.apl",
      "content": "add ← {⍺+⍵}\n2 add 2\n"
    },
    {
      "path": "tests/run.apl",
      "content": "assert ← {⍵: 'ok' ⋄ 'math failed'}\nassert 2+2=4\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "dfn",
      "body": "name ← {⍺+⍵}"
    },
    "variable": {
      "description": "variable",
      "body": "name ← 1"
    },
    "loop": {
      "description": "each",
      "body": "name ← {⍵×2}¨ 1 2 3"
    }
  },
  "reference": "APL syntax reference\n- Function: name ← {⍺+⍵}\n- Tradefn: ∇ result ← name arg ... ∇\n- Variable: name ← 1\n- Add: 1 + 2\n- Reduce: +/ 1 2 3\n- Each: {⍵×2}¨ 1 2 3\n- Load: )load file\n- Comment: ⍝ line\n- Run: dyalog -script file.apl"
}
