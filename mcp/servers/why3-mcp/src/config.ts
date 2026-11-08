import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "why3",
  "displayName": "Why3",
  "version": "1.0.0",
  "extensions": [
    ".mlw"
  ],
  "markers": [],
  "comment": "(*",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*let\\s+([a-z][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.mlw",
      "content": "let add (a b: int) : int = a + b\n"
    },
    {
      "path": "tests/run.mlw",
      "content": "let add (a b: int) : int = a + b\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "let add (a b: int) : int = a + b\n"
    }
  },
  "reference": "Why3 syntax reference\n- Example: let add (a b: int) : int = a + b",
  "blockComment": {
    "start": "(*",
    "end": "*)"
  }
}
