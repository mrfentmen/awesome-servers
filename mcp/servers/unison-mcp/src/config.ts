import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "unison",
  "displayName": "Unison",
  "version": "1.0.0",
  "extensions": [
    ".u"
  ],
  "markers": [],
  "comment": "--",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*([a-z][A-Za-z0-9_'-]*)\\s*:"
    },
    {
      "kind": "type",
      "pattern": "^\\s*type\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "use",
      "pattern": "^\\s*use\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.u",
      "content": "add : Nat -> Nat -> Nat\nadd a b = a + b\n"
    },
    {
      "path": "tests/run.u",
      "content": "add : Nat -> Nat -> Nat\nadd a b = a + b\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "value : Nat -> Nat\nvalue a = a + 1"
    }
  },
  "reference": "Unison syntax reference\n- Function: value : Nat -> Nat; value a = a + 1\n- Type: type Name = ...\n- Use: use Nat +\n- Variable: value = 1\n- Conditional: if condition then ... else ...\n- Comment: -- line\n- Run: ucm"
}
