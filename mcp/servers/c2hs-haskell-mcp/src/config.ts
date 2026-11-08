import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "c2hs-haskell",
  "displayName": "C2hs Haskell",
  "version": "1.0.0",
  "extensions": [
    ".chs"
  ],
  "markers": [],
  "comment": "--",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "module",
      "pattern": "^\\s*module\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.chs",
      "content": "module Demo where\n\n{#fun add as add {`Int', `Int' -> `Int'#}\n"
    },
    {
      "path": "tests/run.chs",
      "content": "module Demo where\n\n{#fun add as add {`Int', `Int' -> `Int'#}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "module Demo where\n\n{#fun add as add {`Int', `Int' -> `Int'#}\n"
    }
  },
  "reference": "C2hs Haskell syntax reference\n- Example: module Demo where\n- Comment: --\n- Run: c2hs {file}",
  "blockComment": {
    "start": "{-",
    "end": "-}"
  }
}
