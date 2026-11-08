import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "cecil",
  "displayName": "Cecil",
  "version": "1.0.0",
  "extensions": [
    ".cecil"
  ],
  "markers": [],
  "comment": "--",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "class",
      "pattern": "^\\s*class\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.cecil",
      "content": "class Demo is\n  method add(a: int, b: int): int { a + b };\nend;\n"
    },
    {
      "path": "tests/run.cecil",
      "content": "class Demo is\n  method add(a: int, b: int): int { a + b };\nend;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "class Demo is\n  method add(a: int, b: int): int { a + b };\nend;\n"
    }
  },
  "reference": "Cecil syntax reference\n- Example: class Demo is"
}
