import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "ring",
  "displayName": "Ring",
  "version": "1.0.0",
  "extensions": [
    ".ring"
  ],
  "markers": [],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*func\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "class",
      "pattern": "^\\s*(?:class|package)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "load",
      "pattern": "^\\s*load\\s+\"([^\"]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.ring",
      "content": "func add a, b\n  return a + b\n"
    },
    {
      "path": "tests/run.ring",
      "content": "func add a, b\n  return a + b\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "func value a\n  return a + 1"
    }
  },
  "reference": "Ring syntax reference\n- Function: func value a return a + 1\n- Class: class Name\n- Package: package name\n- Load: load \"file.ring\"\n- Variable: value = 1\n- Conditional: if condition ... ok\n- Loop: for i = 1 to 10 ... next\n- Comment: # line\n- Run: ring file.ring"
}
