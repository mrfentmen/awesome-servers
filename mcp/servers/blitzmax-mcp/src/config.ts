import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "blitzmax",
  "displayName": "BlitzMax",
  "version": "1.0.0",
  "extensions": [
    ".bmx"
  ],
  "markers": [],
  "comment": "'",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*Function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.bmx",
      "content": "Function Add:Int(a:Int, b:Int)\n  Return a + b\nEnd Function\n"
    },
    {
      "path": "tests/run.bmx",
      "content": "Function Add:Int(a:Int, b:Int)\n  Return a + b\nEnd Function\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "Function Add:Int(a:Int, b:Int)\n  Return a + b\nEnd Function\n"
    }
  },
  "reference": "BlitzMax syntax reference\n- Example: Function Add:Int(a:Int, b:Int)\n- Comment: '\n- Run: bmk makeapp"
}
