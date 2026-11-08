import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "urweb",
  "displayName": "Ur/Web",
  "version": "1.0.0",
  "extensions": [
    ".ur"
  ],
  "markers": [],
  "comment": "(*",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*fun\\s+([a-z][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.ur",
      "content": "fun add (a : int, b : int) : int = a + b\n"
    },
    {
      "path": "tests/run.ur",
      "content": "fun add (a : int, b : int) : int = a + b\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "fun add (a : int, b : int) : int = a + b\n"
    }
  },
  "reference": "Ur/Web syntax reference\n- Example: fun add (a : int, b : int) : int = a + b",
  "blockComment": {
    "start": "(*",
    "end": "*)"
  }
}
