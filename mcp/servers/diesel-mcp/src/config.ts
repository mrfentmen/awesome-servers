import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "diesel",
  "displayName": "Diesel",
  "version": "1.0.0",
  "extensions": [
    ".diesel"
  ],
  "markers": [],
  "comment": "//",
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
      "path": "src/demo.diesel",
      "content": "class Demo {\n  add(a: int, b: int): int { a + b }\n}\n"
    },
    {
      "path": "tests/run.diesel",
      "content": "class Demo {\n  add(a: int, b: int): int { a + b }\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "class Demo {\n  add(a: int, b: int): int { a + b }\n}\n"
    }
  },
  "reference": "Diesel syntax reference\n- Example: class Demo {"
}
